const mongoose = require('mongoose');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

const { deductInventoryForOrder } = require('../utils/inventoryManager');

// @desc    Create new order with server-calculated total
// @route   POST /api/orders
const createOrder = async (req, res) => {
    const { tableNumber, items, tip } = req.body || {};

    const tableNum = parseInt(tableNumber, 10);
    if (isNaN(tableNum) || tableNum <= 0) {
        return res.status(400).json({ message: 'Valid positive table number is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'No items in order' });
    }

    try {
        // Verify items and calculate server-side pricing
        const verifiedItems = [];
        let subtotal = 0;

        for (const item of items) {
            const quantity = parseInt(item.quantity, 10);
            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ message: `Invalid quantity for item ${item.name || 'unnamed'}` });
            }

            let menuItemDoc = null;
            const itemId = item.menuItemId || item.menuItem;
            if (itemId && mongoose.Types.ObjectId.isValid(itemId)) {
                menuItemDoc = await MenuItem.findById(itemId);
            }
            if (!menuItemDoc && item.name) {
                menuItemDoc = await MenuItem.findOne({ name: item.name });
            }

            let price = 0;
            if (menuItemDoc) {
                price = Number(menuItemDoc.price);
                verifiedItems.push({
                    menuItem: menuItemDoc._id.toString(),
                    name: menuItemDoc.name,
                    quantity,
                    price
                });
            } else if (item.price && Number(item.price) > 0) {
                // Fallback for custom/test items
                price = Number(item.price);
                verifiedItems.push({
                    menuItem: itemId || 'custom',
                    name: item.name || 'Special Item',
                    quantity,
                    price
                });
            } else {
                return res.status(400).json({ message: `Item not found or price invalid: ${item.name || itemId}` });
            }

            subtotal += price * quantity;
        }

        // Standard 5% GST tax calculation
        const tax = subtotal * 0.05;
        const verifiedTip = (typeof tip === 'number' && tip >= 0) ? Number(tip) : 0;
        const serverTotalAmount = Number((subtotal + tax + verifiedTip).toFixed(2));

        // 1. HARD SAFETY CHECK & INVENTORY DEDUCTION (Atomic-like)
        // This will throw if stock is insufficient, preventing the order.
        await deductInventoryForOrder(verifiedItems);

        const order = new Order({
            tableNumber: tableNum,
            items: verifiedItems,
            totalAmount: serverTotalAmount,
            tip: verifiedTip,
            status: 'Pending'
        });

        const createdOrder = await order.save();

        // 3. Update Table Status
        try {
            const table = await Table.findOne({ tableId: tableNum });
            if (table) {
                table.status = 'occupied';
                table.currentBill = (table.currentBill || 0) + serverTotalAmount;
                if (!table.sessionStart) table.sessionStart = new Date();
                await table.save();
            }
        } catch (tableErr) {
            console.error(`[Order] Failed to update table status: ${tableErr.message}`);
        }

        // 4. Emit Socket Events
        const io = req.app.get('socketio');
        if (io) {
            io.emit('new_order', createdOrder);
            io.emit('table_update', { tableId: tableNum });
            io.emit('menu_updated');
        }

        res.status(201).json(createdOrder);

    } catch (error) {
        console.error(`[Order] Failed to create order: ${error.message}`);
        if (error.message.includes('Insufficient stock')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error processing order' });
    }
};

// @desc    Get active orders only (history disabled)
// @route   GET /api/orders
const getOrders = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const filter = {
            createdAt: { $gte: todayStart },
            status: { $nin: ['Paid', 'Cancelled'] }
        };

        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Order Status
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    // In real auth, we'd get this from req.user
    const currentRole = 'Kitchen';

    try {
        const order = await Order.findById(id);

        if (order) {
            order.status = status;
            const updatedOrder = await order.save();

            // If Paid → auto-reset table to available
            if (status === 'Paid') {
                try {
                    const table = await Table.findOne({ tableId: order.tableNumber });
                    if (table) {
                        // Check if there are other active orders for this table
                        const otherActive = await Order.countDocuments({
                            tableNumber: order.tableNumber,
                            status: { $nin: ['Paid', 'Cancelled'] },
                            _id: { $ne: order._id }
                        });
                        if (otherActive === 0) {
                            table.status = 'available';
                            table.currentBill = 0;
                            table.sessionStart = null;
                            await table.save();
                            console.log(`[Order] Table ${order.tableNumber} auto-reset to available (bill paid)`);
                        }
                    }
                } catch (tableErr) {
                    console.error(`[Order] Failed to reset table: ${tableErr.message}`);
                }
            }

            // Emit Socket Events to ALL screens
            const io = req.app.get('socketio');
            io.emit('order_status_update', updatedOrder);  // Kitchen, Customer, Admin, Waiter
            io.emit('table_update', { tableId: order.tableNumber }); // Waiter Dashboard tables

            // Only remove CANCELLED orders — Paid orders must stay in DB for analytics & revenue tracking.
            if (status === 'Cancelled') {
                await Order.deleteOne({ _id: order._id });
            }

            res.json(updatedOrder);
        } else {
            console.log(`[Backend] Order ${id} not found`);
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(`[Backend] Error updating order: ${error.message}`);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Mark all active orders for a table as Paid & reset table
// @route   PUT /api/orders/table/:tableId/mark-paid
const markTablePaid = async (req, res) => {
    const { tableId } = req.params;

    try {
        // 1. Find all active (non-paid) orders for this table
        const activeOrders = await Order.find({
            tableNumber: tableId,
            status: { $nin: ['Paid', 'Cancelled'] }
        });

        if (activeOrders.length === 0) {
            // No active orders, just reset the table
            const table = await Table.findOne({ tableId });
            if (table) {
                table.status = 'available';
                table.currentBill = 0;
                table.sessionStart = null;
                await table.save();
            }

            const io = req.app.get('socketio');
            io.emit('table_update', { tableId });
            return res.json({ message: 'Table cleared (no active orders)', updatedOrders: [] });
        }

        // 2. Mark all active orders as Paid
        const updatedOrders = [];
        for (const order of activeOrders) {
            order.status = 'Paid';
            order.paymentMode = req.body.paymentMode || 'Cash';
            await order.save();
            updatedOrders.push(order);
        }

        // NOTE: Paid orders are KEPT in the database for analytics & revenue tracking.
        // Only Cancelled orders should be removed. Do NOT deleteMany here.

        // 3. Reset table to available
        const table = await Table.findOne({ tableId });
        if (table) {
            table.status = 'available';
            table.currentBill = 0;
            table.sessionStart = null;
            await table.save();
        }

        // 4. Emit socket events for ALL screens to update
        const io = req.app.get('socketio');
        updatedOrders.forEach(order => {
            io.emit('order_status_update', order);
        });
        io.emit('table_update', { tableId });

        res.json({
            message: `${updatedOrders.length} order(s) marked as Paid for Table ${tableId}`,
            updatedOrders
        });
    } catch (error) {
        console.error(`[Waiter] Failed to mark table ${tableId} as paid:`, error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { createOrder, getOrders, updateOrderStatus, markTablePaid };
