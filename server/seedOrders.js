/**
 * AKXTON POS — Sample Orders Seeder
 * 
 * Creates realistic historical orders across the past 30 days.
 * Run with:  node seedOrders.js
 * 
 * What it seeds:
 *  - 200+ orders spread over last 30 days
 *  - Multiple tables (1-10)
 *  - All menu items
 *  - All statuses (Paid, Served, Cancelled)
 *  - Realistic time distribution (lunch/dinner peaks)
 *  - Tips and payment modes
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Order = require('./models/Order');
const MenuItem = require('./models/MenuItem');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

// ── Helpers ──────────────────────────────────────────────

// Returns a date N days ago with a specific hour
const daysAgo = (days, hour, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d;
};

// Random integer between min and max (inclusive)
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Random item from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Main Seeder ───────────────────────────────────────────

const seedOrders = async () => {
    await connectDB();

    try {
        // 1. Clear existing orders
        const existing = await Order.countDocuments();
        if (existing > 0) {
            await Order.deleteMany({});
            console.log(`🗑️  Cleared ${existing} existing orders`);
        }

        // 2. Load all menu items from DB
        const menuItems = await MenuItem.find({});
        if (menuItems.length === 0) {
            console.error('❌ No menu items found! Run: node seedExtended.js first');
            process.exit(1);
        }
        console.log(`📋 Found ${menuItems.length} menu items: ${menuItems.map(m => m.name).join(', ')}`);

        // ── Order templates (realistic combos) ─────────────────
        const getMenuItemRef = (name) => menuItems.find(m => m.name === name);

        const orderTemplates = [
            // Lunch combos
            { items: ['Classic Chicken Burger', 'Crispy Fries', 'Masala Chai'], table: 1 },
            { items: ['Margherita Pizza', 'Fresh Lime Soda'], table: 2 },
            { items: ['Classic Chicken Burger', 'Cappuccino'], table: 3 },
            { items: ['Crispy Fries', 'Masala Chai'], table: 4 },
            { items: ['Margherita Pizza', 'Classic Mojito'], table: 5 },
            // Dinner combos
            { items: ['Classic Chicken Burger', 'Crispy Fries', 'Classic Mojito'], table: 6 },
            { items: ['Margherita Pizza', 'Vanilla Scoop', 'Iced Caramel Macchiato'], table: 7 },
            { items: ['Crispy Fries', 'Fresh Lime Soda', 'Vanilla Scoop'], table: 8 },
            { items: ['Classic Chicken Burger', 'Iced Caramel Macchiato'], table: 9 },
            { items: ['Margherita Pizza', 'Crispy Fries', 'Masala Chai'], table: 10 },
            // Single item orders
            { items: ['Masala Chai'], table: 2 },
            { items: ['Cappuccino'], table: 4 },
            { items: ['Vanilla Scoop'], table: 1 },
            { items: ['Fresh Lime Soda', 'Crispy Fries'], table: 3 },
            { items: ['Classic Mojito', 'Margherita Pizza'], table: 6 },
        ];

        // ── Peak hours distribution ─────────────────────────────
        // Weighted: more orders during lunch (12-14) and dinner (19-21)
        const peakHours = [
            10, 10,                          // Morning tea
            12, 12, 12, 13, 13, 13, 14, 14, // Lunch peak
            16, 16,                          // Afternoon snacks
            19, 19, 19, 20, 20, 20, 21, 21  // Dinner peak
        ];

        const paymentModes = ['Cash', 'Cash', 'Cash', 'Online', 'Online'];
        const tipOptions = [0, 0, 0, 10, 20, 30, 50]; // Most orders have no tip

        const ordersToInsert = [];
        let totalOrders = 0;

        // ── Generate orders for last 30 days ───────────────────
        for (let day = 30; day >= 0; day--) {

            // Weekends get more orders
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - day);
            const dayOfWeek = targetDate.getDay(); // 0=Sun, 6=Sat
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const ordersThisDay = isWeekend ? randInt(10, 16) : randInt(5, 10);

            for (let o = 0; o < ordersThisDay; o++) {
                const template = pick(orderTemplates);
                const hour = pick(peakHours);
                const minute = randInt(0, 59);

                // Build order items from template
                const orderItems = [];
                let subtotal = 0;

                for (const itemName of template.items) {
                    const menuItem = getMenuItemRef(itemName);
                    if (!menuItem) continue;

                    const qty = randInt(1, 3);
                    const lineTotal = menuItem.price * qty;
                    subtotal += lineTotal;

                    orderItems.push({
                        menuItem: menuItem._id.toString(),
                        name: menuItem.name,
                        quantity: qty,
                        price: menuItem.price
                    });
                }

                if (orderItems.length === 0) continue;

                // Calculate GST (5%) and optional tip
                const gst = Math.round(subtotal * 0.05);
                const tip = pick(tipOptions);
                const totalAmount = subtotal + gst + tip;

                // Determine status — old orders are mostly paid
                let status;
                if (day > 1) {
                    // Historical: 85% Paid, 10% Served, 5% Cancelled
                    const r = Math.random();
                    status = r < 0.85 ? 'Paid' : r < 0.95 ? 'Served' : 'Cancelled';
                } else if (day === 1) {
                    // Yesterday: mix of Paid and Served
                    status = Math.random() < 0.7 ? 'Paid' : 'Served';
                } else {
                    // Today: active orders (Pending/Preparing/Ready/Served)
                    const r = Math.random();
                    status = r < 0.25 ? 'Pending'
                           : r < 0.50 ? 'Preparing'
                           : r < 0.75 ? 'Ready'
                           : 'Served';
                }

                // Build createdAt timestamp
                const createdAt = daysAgo(day, hour, minute);

                ordersToInsert.push({
                    tableNumber: template.table,
                    items: orderItems,
                    totalAmount,
                    tip,
                    status,
                    paymentMode: (status === 'Paid') ? pick(paymentModes) : 'Pending',
                    estimatedPrepTime: randInt(10, 20),
                    createdAt,
                    updatedAt: createdAt
                });

                totalOrders++;
            }
        }

        // ── Bulk insert all orders ─────────────────────────────
        await Order.insertMany(ordersToInsert, { timestamps: false });

        // ── Print summary ──────────────────────────────────────
        const paidCount     = ordersToInsert.filter(o => o.status === 'Paid').length;
        const activeCount   = ordersToInsert.filter(o => ['Pending','Preparing','Ready'].includes(o.status)).length;
        const cancelledCount = ordersToInsert.filter(o => o.status === 'Cancelled').length;
        const totalRevenue  = ordersToInsert
            .filter(o => o.status !== 'Cancelled')
            .reduce((sum, o) => sum + o.totalAmount, 0);

        console.log('\n✅ Orders seeded successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📦 Total Orders    : ${totalOrders}`);
        console.log(`✅ Paid            : ${paidCount}`);
        console.log(`🟡 Active (today)  : ${activeCount}`);
        console.log(`❌ Cancelled       : ${cancelledCount}`);
        console.log(`💰 Total Revenue   : ₹${totalRevenue.toLocaleString()}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🚀 Your Analytics, AI Insights & Forecast pages now have real data!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedOrders();
