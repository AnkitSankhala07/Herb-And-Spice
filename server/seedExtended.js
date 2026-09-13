const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Inventory = require('./models/Inventory');
const MenuItem = require('./models/MenuItem');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // Remove legacy index from old schema versions if present.
        try {
            await Inventory.collection.dropIndex('name_1');
            console.log('Dropped legacy index: inventories.name_1');
        } catch (idxErr) {
            // Ignore if index does not exist.
        }

        // 1. Clear existing data (Optional, but good for clean state if requested)
        // await Inventory.deleteMany({});
        // await MenuItem.deleteMany({});
        // console.log('Cleared existing data...');

        // 2. Upsert Inventory Items
        const inventoryItems = [
            { name: 'Burger Bun', quantity: 100, unit: 'pcs', threshold: 20 },
            { name: 'Chicken Patty', quantity: 50, unit: 'pcs', threshold: 10 },
            { name: 'Veg Patty', quantity: 50, unit: 'pcs', threshold: 10 },
            { name: 'Cheese Slice', quantity: 100, unit: 'pcs', threshold: 20 },
            { name: 'Cheese', quantity: 10, unit: 'kg', threshold: 2 },
            { name: 'Tomato', quantity: 20, unit: 'kg', threshold: 5 },
            { name: 'Potato', quantity: 50, unit: 'kg', threshold: 10 },
            { name: 'Coffee Beans', quantity: 5, unit: 'kg', threshold: 1 },
            { name: 'Milk', quantity: 20, unit: 'liters', threshold: 5 },
            { name: 'Sugar', quantity: 10, unit: 'kg', threshold: 2 },
            { name: 'Tea Leaves', quantity: 2, unit: 'kg', threshold: 0.5 },
            { name: 'Pizza Base', quantity: 30, unit: 'pcs', threshold: 5 },
            { name: 'Pizza Sauce', quantity: 5, unit: 'liters', threshold: 1 },
            { name: 'Ice Cream Tub (Vanilla)', quantity: 10, unit: 'tubs', threshold: 2 },
            { name: 'Chocolate Syrup', quantity: 5, unit: 'liters', threshold: 1 }
        ];

        for (const item of inventoryItems) {
            await Inventory.findOneAndUpdate(
                { name: item.name },
                item,
                { upsert: true, new: true }
            );
        }
        console.log('Inventory Synced!');

        // 3. Get Inventory IDs for linking
        const inv = await Inventory.find({});
        const getInvId = (name) => {
            const item = inv.find(i => i.name === name);
            if (!item) console.warn(`Warning: Ingredient ${name} not found!`);
            return item ? item._id : null;
        };

        // 4. Upsert Menu Items
        const menuItems = [
            {
                name: 'Classic Chicken Burger',
                category: 'Burgers',
                price: 180,
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Chicken Patty'), quantityRequired: 1 },
                    { ingredientId: getInvId('Cheese Slice'), quantityRequired: 1 },
                    { ingredientId: getInvId('Tomato'), quantityRequired: 0.1 }
                ],
                description: 'Juicy chicken patty with cheddar cheese and fresh veggies.',
                popularityScore: 90
            },
            {
                name: 'Crispy Fries',
                category: 'Sides',
                price: 110,
                imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Potato'), quantityRequired: 0.3 }
                ],
                description: 'Golden crispy potato fingers with sea salt.',
                popularityScore: 85
            },
            {
                name: 'Cappuccino',
                category: 'Drinks',
                price: 140,
                imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Coffee Beans'), quantityRequired: 0.02 },
                    { ingredientId: getInvId('Milk'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('Sugar'), quantityRequired: 0.01 }
                ],
                description: 'Rich espresso with steamed milk foam.',
                popularityScore: 88
            },
            {
                name: 'Masala Chai',
                category: 'Drinks',
                price: 60,
                imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Tea Leaves'), quantityRequired: 0.01 },
                    { ingredientId: getInvId('Milk'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Sugar'), quantityRequired: 0.01 }
                ],
                description: 'Authentic Indian spiced tea.',
                popularityScore: 92
            },
            {
                name: 'Fresh Lime Soda',
                category: 'Drinks',
                price: 80,
                imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Sugar'), quantityRequired: 0.02 }
                ],
                description: 'Refreshing sweet and salt lime soda over ice.',
                popularityScore: 95
            },
            {
                name: 'Classic Mojito',
                category: 'Drinks',
                price: 150,
                imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Sugar'), quantityRequired: 0.01 }
                ],
                description: 'Minty, zesty, and refreshing mocktail signature.',
                popularityScore: 88
            },
            {
                name: 'Iced Caramel Macchiato',
                category: 'Drinks',
                price: 180,
                imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Coffee Beans'), quantityRequired: 0.02 },
                    { ingredientId: getInvId('Milk'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('Sugar'), quantityRequired: 0.02 }
                ],
                description: 'Chilled espresso poured over milk and caramel.',
                popularityScore: 91
            },
            {
                name: 'Margherita Pizza',
                category: 'Pizza',
                price: 290,
                imageUrl: 'https://images.unsplash.com/photo-1574071318500-add0e5c66919?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base'), quantityRequired: 1 },
                    { ingredientId: getInvId('Pizza Sauce'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Cheese'), quantityRequired: 0.2 }
                ],
                description: 'Classic wood-fired pizza with basil and mozzarella.',
                popularityScore: 89
            },
            {
                name: 'Vanilla Scoop',
                category: 'Desserts',
                price: 90,
                imageUrl: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Ice Cream Tub (Vanilla)'), quantityRequired: 0.1 }
                ],
                description: 'Creamy vanilla bean ice cream.',
                popularityScore: 80
            }
        ];

        for (const item of menuItems) {
            // Filter out ingredients that might be null (if not found in inventory)
            item.ingredients = item.ingredients.filter(i => i.ingredientId);

            await MenuItem.findOneAndUpdate(
                { name: item.name },
                item,
                { upsert: true, new: true }
            );
        }
        console.log('Menu Items Synced!');

        // 5. Seed Users
        const User = require('./models/User');
        const users = [
            { name: 'Admin User', email: 'admin@akxton.com', password: 'admin123', role: 'admin' },
            { name: 'Chef Kumar', email: 'chef@akxton.com', password: 'chef123', role: 'kitchen' },
            { name: 'Waiter Raj', email: 'waiter@akxton.com', password: 'waiter123', role: 'waiter' },
            { name: 'Customer Guest', email: 'guest@akxton.com', password: 'guest123', role: 'customer' }
        ];

        for (const user of users) {
            const exists = await User.findOne({ email: user.email });
            if (!exists) {
                await User.create(user);
            }
        }
        console.log('Users seeded!');

        console.log('✅ Database seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

seedData();
