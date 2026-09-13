const Inventory = require('../models/Inventory');

// @desc    Get Inventory with "Smart Forecast"
// @route   GET /api/inventory
const getInventory = async (req, res) => {
    const items = await Inventory.find({});

    // SMART INTELLIGENCE: Add a "daysRemaining" field based on mock daily usage
    const fastMovingItems = ['Tomato', 'Cheese', 'Chicken']; // Mock list

    const smartInventory = items.map(item => {
        let dailyUsage = 0;
        if (fastMovingItems.includes(item.name)) {
            dailyUsage = 5; // Mock: we use 5 units a day
        } else {
            dailyUsage = 1;
        }

        const daysRemaining = Math.floor(item.quantity / dailyUsage);

        return {
            ...item._doc,
            daysRemaining,
            status: daysRemaining < 2 ? 'Critical' : daysRemaining < 5 ? 'Low' : 'Good'
        };
    });

    res.json(smartInventory);
};

const { syncAllMenuItems } = require('../utils/inventoryManager');

// @desc    Update Stock
const updateStock = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body; // New total quantity

    try {
        const item = await Inventory.findById(id);
        if (item) {
            item.quantity = quantity;
            await item.save();

            // TRIGGER AUTO-ENABLE CHECK
            await syncAllMenuItems();

            // Emit update to connected clients so menu refreshes real-time
            const io = req.app.get('socketio');
            if (io) {
                io.emit('menu_updated');
            }

            res.json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating stock', error: error.message });
    }
};

// @desc    Add a new Inventory Item
// @route   POST /api/inventory
const addInventoryItem = async (req, res) => {
    try {
        const { name, quantity, unit, threshold } = req.body;

        // check if exists
        const exists = await Inventory.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Item already exists' });
        }

        const newItem = new Inventory({
            name,
            quantity,
            unit,
            threshold
        });

        const createdItem = await newItem.save();

        // Emit update
        const io = req.app.get('socketio');
        if (io) io.emit('menu_updated');

        res.status(201).json(createdItem);
    } catch (error) {
        res.status(500).json({ message: 'Error adding inventory item', error: error.message });
    }
};

// @desc    Update Inventory Item (General)
// @route   PUT /api/inventory/:id
const updateInventoryItem = async (req, res) => {
    try {
        const { name, quantity, unit, threshold } = req.body;
        const item = await Inventory.findById(req.params.id);

        if (item) {
            item.name = name || item.name;
            item.quantity = quantity !== undefined ? quantity : item.quantity;
            item.unit = unit || item.unit;
            item.threshold = threshold !== undefined ? threshold : item.threshold;

            const updatedItem = await item.save();

            // Sync menu availability
            await syncAllMenuItems();

            // Emit update
            const io = req.app.get('socketio');
            if (io) io.emit('menu_updated');

            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating inventory item', error: error.message });
    }
};

// @desc    Delete Inventory Item
// @route   DELETE /api/inventory/:id
const deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);

        if (item) {
            await item.deleteOne();

            // Emit update
            const io = req.app.get('socketio');
            if (io) io.emit('menu_updated');

            // Re-evaluate menu items after ingredient removal?
            // Theoretically should check if used in menu but for now just delete
            res.json({ message: 'Inventory item removed' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
    }
};

// @desc    Get Low Stock Items (quantity <= threshold)
// @route   GET /api/inventory/low-stock
const getLowStockItems = async (req, res) => {
    try {
        const items = await Inventory.find({
            $expr: { $lte: ["$quantity", "$threshold"] }
        });

        const result = items.map(item => ({
            ...item._doc,
            status: item.quantity <= item.threshold * 0.5 ? 'Critical' : 'Low'
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
    }
};

module.exports = { getInventory, updateStock, addInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStockItems };
