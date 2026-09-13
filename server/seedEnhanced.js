const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Inventory = require('./models/Inventory');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');
const Order = require('./models/Order');
const Table = require('./models/Table');
const ActivityLog = require('./models/ActivityLog');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartresto');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const seedEnhancedData = async () => {
    await connectDB();

    try {
        console.log('🌱 Starting enhanced data seeding...\n');

        // ============================================
        // 1. SEED EXPANDED INVENTORY
        // ============================================
        console.log('📦 Seeding expanded inventory items...');
        const inventoryItems = [
            // Proteins
            { name: 'Chicken Breast', quantity: 80, unit: 'pcs', threshold: 15 },
            { name: 'Chicken Thigh', quantity: 60, unit: 'pcs', threshold: 12 },
            { name: 'Mutton', quantity: 40, unit: 'kg', threshold: 8 },
            { name: 'Fish Fillet', quantity: 50, unit: 'pcs', threshold: 10 },
            { name: 'Paneer', quantity: 30, unit: 'kg', threshold: 5 },
            
            // Bread & Bases
            { name: 'Burger Bun', quantity: 120, unit: 'pcs', threshold: 25 },
            { name: 'Pizza Base', quantity: 50, unit: 'pcs', threshold: 10 },
            { name: 'Naan Bread', quantity: 40, unit: 'pcs', threshold: 8 },
            { name: 'Sandwich Bread', quantity: 60, unit: 'pcs', threshold: 12 },
            
            // Vegetables
            { name: 'Tomato', quantity: 50, unit: 'kg', threshold: 10 },
            { name: 'Onion', quantity: 60, unit: 'kg', threshold: 12 },
            { name: 'Lettuce', quantity: 20, unit: 'kg', threshold: 4 },
            { name: 'Cucumber', quantity: 15, unit: 'kg', threshold: 3 },
            { name: 'Bell Pepper', quantity: 15, unit: 'kg', threshold: 3 },
            { name: 'Carrot', quantity: 25, unit: 'kg', threshold: 5 },
            { name: 'Potato', quantity: 100, unit: 'kg', threshold: 20 },
            
            // Dairy
            { name: 'Cheese Slice', quantity: 150, unit: 'pcs', threshold: 30 },
            { name: 'Cheese Block', quantity: 20, unit: 'kg', threshold: 4 },
            { name: 'Milk', quantity: 50, unit: 'liters', threshold: 10 },
            { name: 'Butter', quantity: 10, unit: 'kg', threshold: 2 },
            { name: 'Cream', quantity: 5, unit: 'liters', threshold: 1 },
            
            // Condiments & Sauces
            { name: 'Tomato Sauce', quantity: 10, unit: 'liters', threshold: 2 },
            { name: 'Mayonnaise', quantity: 5, unit: 'liters', threshold: 1 },
            { name: 'BBQ Sauce', quantity: 5, unit: 'liters', threshold: 1 },
            { name: 'Chili Sauce', quantity: 5, unit: 'liters', threshold: 1 },
            { name: 'Garlic Paste', quantity: 2, unit: 'kg', threshold: 0.5 },
            { name: 'Ginger Paste', quantity: 2, unit: 'kg', threshold: 0.5 },
            
            // Beverages
            { name: 'Coffee Beans', quantity: 10, unit: 'kg', threshold: 2 },
            { name: 'Tea Leaves', quantity: 5, unit: 'kg', threshold: 1 },
            { name: 'Sugar', quantity: 25, unit: 'kg', threshold: 5 },
            { name: 'Cocoa Powder', quantity: 3, unit: 'kg', threshold: 0.5 },
            
            // Desserts & Others
            { name: 'Ice Cream (Vanilla)', quantity: 20, unit: 'tubs', threshold: 4 },
            { name: 'Ice Cream (Chocolate)', quantity: 15, unit: 'tubs', threshold: 3 },
            { name: 'Ice Cream (Strawberry)', quantity: 15, unit: 'tubs', threshold: 3 },
            { name: 'Chocolate Syrup', quantity: 8, unit: 'liters', threshold: 2 },
            { name: 'Caramel Sauce', quantity: 5, unit: 'liters', threshold: 1 }
        ];

        for (const item of inventoryItems) {
            await Inventory.findOneAndUpdate(
                { name: item.name },
                item,
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Seeded ${inventoryItems.length} inventory items\n`);

        // ============================================
        // 2. GET INVENTORY IDS
        // ============================================
        const inv = await Inventory.find({});
        const getInvId = (name) => {
            const item = inv.find(i => i.name === name);
            return item ? item._id : null;
        };

        // ============================================
        // 3. SEED EXPANDED MENU ITEMS
        // ============================================
        console.log('🍽️  Seeding expanded menu items...');
        const menuItems = [
            // ===== BURGERS (5 items) =====
            {
                name: 'Classic Chicken Burger',
                category: 'Burgers',
                price: 180,
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Chicken Breast'), quantityRequired: 0.15 },
                    { ingredientId: getInvId('Cheese Slice'), quantityRequired: 1 },
                    { ingredientId: getInvId('Tomato'), quantityRequired: 0.1 }
                ],
                description: 'Juicy grilled chicken patty with cheddar cheese and fresh vegetables.',
                popularityScore: 92
            },
            {
                name: 'Spicy Mutton Burger',
                category: 'Burgers',
                price: 220,
                imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Mutton'), quantityRequired: 0.15 },
                    { ingredientId: getInvId('Chili Sauce'), quantityRequired: 0.05 }
                ],
                description: 'Tender spiced mutton patty with a kick of spices.',
                popularityScore: 85
            },
            {
                name: 'Paneer Delight Burger',
                category: 'Burgers',
                price: 160,
                imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc4e5c90b133?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Paneer'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Lettuce'), quantityRequired: 0.05 }
                ],
                description: 'Crispy paneer patty with fresh lettuce and mayo.',
                popularityScore: 88
            },
            {
                name: 'Fish Fillet Burger',
                category: 'Burgers',
                price: 200,
                imageUrl: 'https://images.unsplash.com/photo-1572440514411-007ad94543e5?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Fish Fillet'), quantityRequired: 0.15 },
                    { ingredientId: getInvId('Cheese Slice'), quantityRequired: 1 }
                ],
                description: 'Crispy fried fish fillet with melted cheddar.',
                popularityScore: 80
            },
            {
                name: 'Double Patty Chicken Burger',
                category: 'Burgers',
                price: 320,
                imageUrl: 'https://images.unsplash.com/photo-1550547990-point?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Chicken Breast'), quantityRequired: 0.3 },
                    { ingredientId: getInvId('Cheese Slice'), quantityRequired: 2 }
                ],
                description: 'Double chicken patties with double cheese - perfect for appetite!',
                popularityScore: 87
            },

            // ===== PIZZAS (4 items) =====
            {
                name: 'Margherita Pizza',
                category: 'Pizza',
                price: 290,
                imageUrl: 'https://images.unsplash.com/photo-1574071318500-add0e5c66919?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base'), quantityRequired: 1 },
                    { ingredientId: getInvId('Tomato Sauce'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Cheese Block'), quantityRequired: 0.15 }
                ],
                description: 'Classic wood-fired pizza with tomato, mozzarella, and fresh basil.',
                popularityScore: 94
            },
            {
                name: 'Chicken Tikka Pizza',
                category: 'Pizza',
                price: 350,
                imageUrl: 'https://images.unsplash.com/photo-1573821663912-b5164b4c6bb8?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base'), quantityRequired: 1 },
                    { ingredientId: getInvId('Chicken Breast'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('Cheese Block'), quantityRequired: 0.15 }
                ],
                description: 'Tandoori spiced chicken with cheese and peppers.',
                popularityScore: 91
            },
            {
                name: 'Veggie Supreme Pizza',
                category: 'Pizza',
                price: 270,
                imageUrl: 'https://images.unsplash.com/photo-1564982752979-3f937ebc4b19?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base'), quantityRequired: 1 },
                    { ingredientId: getInvId('Bell Pepper'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Onion'), quantityRequired: 0.1 }
                ],
                description: 'Loaded with fresh vegetables and mozzarella cheese.',
                popularityScore: 86
            },
            {
                name: 'BBQ Chicken Pizza',
                category: 'Pizza',
                price: 380,
                imageUrl: 'https://images.unsplash.com/photo-1515689519140-ce6c5e8fbe53?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base'), quantityRequired: 1 },
                    { ingredientId: getInvId('Chicken Breast'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('BBQ Sauce'), quantityRequired: 0.1 }
                ],
                description: 'Smoky BBQ chicken with onions and cheese.',
                popularityScore: 89
            },

            // ===== SIDES (4 items) =====
            {
                name: 'Crispy Fries',
                category: 'Sides',
                price: 110,
                imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Potato'), quantityRequired: 0.4 }
                ],
                description: 'Golden crispy potato fries with sea salt.',
                popularityScore: 93
            },
            {
                name: 'Loaded Cheese Fries',
                category: 'Sides',
                price: 180,
                imageUrl: 'https://images.unsplash.com/photo-1518080527399-a578d36cde12?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Potato'), quantityRequired: 0.4 },
                    { ingredientId: getInvId('Cheese Slice'), quantityRequired: 2 }
                ],
                description: 'Crispy fries smothered in melted cheese.',
                popularityScore: 84
            },
            {
                name: 'Garlic Bread',
                category: 'Sides',
                price: 120,
                imageUrl: 'https://images.unsplash.com/photo-1599599810694-d6212dc1add8?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Naan Bread'), quantityRequired: 1 },
                    { ingredientId: getInvId('Butter'), quantityRequired: 0.05 },
                    { ingredientId: getInvId('Garlic Paste'), quantityRequired: 0.02 }
                ],
                description: 'Warm garlic-infused naan with melted butter.',
                popularityScore: 82
            },
            {
                name: 'Onion Rings',
                category: 'Sides',
                price: 130,
                imageUrl: 'https://images.unsplash.com/photo-1639024471869-c0adf9893922?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Onion'), quantityRequired: 0.3 }
                ],
                description: 'Crispy battered and fried onion rings.',
                popularityScore: 79
            },

            // ===== SANDWICHES (3 items) =====
            {
                name: 'Grilled Chicken Sandwich',
                category: 'Sandwiches',
                price: 140,
                imageUrl: 'https://images.unsplash.com/photo-1553909990-fb05bff718b7?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Sandwich Bread'), quantityRequired: 2 },
                    { ingredientId: getInvId('Chicken Breast'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Lettuce'), quantityRequired: 0.05 }
                ],
                description: 'Toasted sandwich with grilled chicken and fresh veggies.',
                popularityScore: 81
            },
            {
                name: 'Paneer & Veggie Sandwich',
                category: 'Sandwiches',
                price: 120,
                imageUrl: 'https://images.unsplash.com/photo-1585238341710-4913dfdc3161?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Sandwich Bread'), quantityRequired: 2 },
                    { ingredientId: getInvId('Paneer'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Cucumber'), quantityRequired: 0.05 }
                ],
                description: 'Crispy paneer with fresh vegetables and mayo.',
                popularityScore: 78
            },
            {
                name: 'Grilled Fish Sandwich',
                category: 'Sandwiches',
                price: 160,
                imageUrl: 'https://images.unsplash.com/photo-1559333086-b0a38235dae4?auto=format&fit=crop&w=800&q=80',
                isVeg: false,
                ingredients: [
                    { ingredientId: getInvId('Sandwich Bread'), quantityRequired: 2 },
                    { ingredientId: getInvId('Fish Fillet'), quantityRequired: 0.12 },
                    { ingredientId: getInvId('Cheese Slice'), quantityRequired: 1 }
                ],
                description: 'Pan-seared fish fillet with cheese and herbs.',
                popularityScore: 76
            },

            // ===== DRINKS (6 items) =====
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
                description: 'Rich espresso with steamed milk and cocoa powder.',
                popularityScore: 90
            },
            {
                name: 'Cold Brew Coffee',
                category: 'Drinks',
                price: 160,
                imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Coffee Beans'), quantityRequired: 0.03 },
                    { ingredientId: getInvId('Milk'), quantityRequired: 0.2 }
                ],
                description: 'Smooth cold brew coffee over ice with milk.',
                popularityScore: 87
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
                description: 'Authentic Indian spiced chai with milk.',
                popularityScore: 95
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
                description: 'Refreshing sweet and salty lime soda over ice.',
                popularityScore: 91
            },
            {
                name: 'Hot Chocolate',
                category: 'Drinks',
                price: 120,
                imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Cocoa Powder'), quantityRequired: 0.02 },
                    { ingredientId: getInvId('Milk'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('Sugar'), quantityRequired: 0.02 }
                ],
                description: 'Warm creamy hot chocolate with whipped cream.',
                popularityScore: 83
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
                    { ingredientId: getInvId('Caramel Sauce'), quantityRequired: 0.05 }
                ],
                description: 'Chilled espresso with caramel and milk over ice.',
                popularityScore: 89
            },

            // ===== DESSERTS (4 items) =====
            {
                name: 'Vanilla Ice Cream Sundae',
                category: 'Desserts',
                price: 140,
                imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Ice Cream (Vanilla)'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('Chocolate Syrup'), quantityRequired: 0.05 }
                ],
                description: 'Creamy vanilla ice cream topped with chocolate syrup and nuts.',
                popularityScore: 85
            },
            {
                name: 'Chocolate Brownie',
                category: 'Desserts',
                price: 120,
                imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Cocoa Powder'), quantityRequired: 0.05 }
                ],
                description: 'Fudgy chocolate brownie served warm with ice cream.',
                popularityScore: 88
            },
            {
                name: 'Strawberry Cheesecake',
                category: 'Desserts',
                price: 180,
                imageUrl: 'https://images.unsplash.com/photo-1613141725881-5e03f6ac4268?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Cream'), quantityRequired: 0.1 }
                ],
                description: 'Creamy cheesecake with fresh strawberry topping.',
                popularityScore: 82
            },
            {
                name: 'Chocolate Chip Cookie',
                category: 'Desserts',
                price: 90,
                imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
                isVeg: true,
                ingredients: [
                    { ingredientId: getInvId('Butter'), quantityRequired: 0.05 }
                ],
                description: 'Warm chocolate chip cookies fresh from the oven.',
                popularityScore: 91
            }
        ];

        for (const item of menuItems) {
            item.ingredients = item.ingredients.filter(i => i.ingredientId);
            await MenuItem.findOneAndUpdate(
                { name: item.name },
                item,
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Seeded ${menuItems.length} menu items\n`);

        // ============================================
        // 4. SEED USERS
        // ============================================
        console.log('👥 Seeding demo users...');
        const users = [
            { name: 'Admin User', email: 'admin@akxton.com', password: 'admin123', role: 'admin' },
            { name: 'Chef Kumar', email: 'chef@akxton.com', password: 'chef123', role: 'kitchen' },
            { name: 'Waiter Raj', email: 'waiter@akxton.com', password: 'waiter123', role: 'waiter' },
            { name: 'Customer Guest', email: 'guest@akxton.com', password: 'guest123', role: 'customer' },
            { name: 'Manager Singh', email: 'manager@akxton.com', password: 'manager123', role: 'admin' },
            { name: 'Chef Priya', email: 'priya@akxton.com', password: 'priya123', role: 'kitchen' }
        ];

        const createdUsers = {};
        for (const user of users) {
            const exists = await User.findOne({ email: user.email });
            if (exists) {
                createdUsers[user.role] = exists._id;
            } else {
                const created = await User.create(user);
                createdUsers[user.role] = created._id;
            }
        }
        console.log(`✅ Seeded ${users.length} users\n`);

        // ============================================
        // 5. SEED TABLES
        // ============================================
        console.log('🪑 Seeding restaurant tables...');
        const existingTables = await Table.countDocuments();
        if (existingTables === 0) {
            const tables = [
                { tableId: 1, capacity: 2, status: 'available', currentBill: 0 },
                { tableId: 2, capacity: 2, status: 'occupied', currentBill: 450 },
                { tableId: 3, capacity: 4, status: 'available', currentBill: 0 },
                { tableId: 4, capacity: 4, status: 'occupied', currentBill: 890 },
                { tableId: 5, capacity: 6, status: 'available', currentBill: 0 },
                { tableId: 6, capacity: 6, status: 'occupied', currentBill: 1200 }
            ];
            await Table.insertMany(tables);
            console.log(`✅ Seeded ${tables.length} tables\n`);
        } else {
            console.log(`✅ Tables already exist (${existingTables})\n`);
        }

        // ============================================
        // 6. SEED SAMPLE ORDERS
        // ============================================
        console.log('📋 Seeding sample orders...');
        const pastOrdersCount = await Order.countDocuments();
        if (pastOrdersCount === 0) {
            const sampleOrders = [
                {
                    tableNumber: 1,
                    items: [
                        { name: 'Masala Chai', quantity: 2, price: 60 },
                        { name: 'Chocolate Chip Cookie', quantity: 1, price: 90 }
                    ],
                    totalAmount: 210,
                    status: 'Served',
                    paymentMode: 'Cash',
                    estimatedPrepTime: 5
                },
                {
                    tableNumber: 2,
                    items: [
                        { name: 'Classic Chicken Burger', quantity: 2, price: 180 },
                        { name: 'Crispy Fries', quantity: 2, price: 110 },
                        { name: 'Cold Brew Coffee', quantity: 2, price: 160 }
                    ],
                    totalAmount: 660,
                    status: 'Ready',
                    paymentMode: 'Online',
                    tip: 50,
                    estimatedPrepTime: 15
                },
                {
                    tableNumber: 3,
                    items: [
                        { name: 'Margherita Pizza', quantity: 1, price: 290 }
                    ],
                    totalAmount: 290,
                    status: 'Preparing',
                    paymentMode: 'Pending',
                    estimatedPrepTime: 20
                },
                {
                    tableNumber: 4,
                    items: [
                        { name: 'Chicken Tikka Pizza', quantity: 1, price: 350 },
                        { name: 'Garlic Bread', quantity: 1, price: 120 },
                        { name: 'Iced Caramel Macchiato', quantity: 2, price: 180 }
                    ],
                    totalAmount: 650,
                    status: 'Preparing',
                    paymentMode: 'Pending',
                    estimatedPrepTime: 25
                },
                {
                    tableNumber: 5,
                    items: [
                        { name: 'Paneer Delight Burger', quantity: 3, price: 160 },
                        { name: 'Loaded Cheese Fries', quantity: 2, price: 180 },
                        { name: 'Cappuccino', quantity: 3, price: 140 }
                    ],
                    totalAmount: 1280,
                    status: 'Pending',
                    paymentMode: 'Pending',
                    estimatedPrepTime: 20
                },
                {
                    tableNumber: 6,
                    items: [
                        { name: 'BBQ Chicken Pizza', quantity: 1, price: 380 },
                        { name: 'Fresh Lime Soda', quantity: 4, price: 80 },
                        { name: 'Vanilla Ice Cream Sundae', quantity: 4, price: 140 }
                    ],
                    totalAmount: 1260,
                    status: 'Served',
                    paymentMode: 'Cash',
                    tip: 100,
                    estimatedPrepTime: 30
                }
            ];

            await Order.insertMany(sampleOrders);
            console.log(`✅ Seeded ${sampleOrders.length} sample orders\n`);
        } else {
            console.log(`✅ Orders already exist (${pastOrdersCount})\n`);
        }

        // ============================================
        // 7. SEED ACTIVITY LOGS
        // ============================================
        console.log('📊 Seeding activity logs...');
        const existingLogs = await ActivityLog.countDocuments();
        if (existingLogs === 0) {
            const adminUser = await User.findOne({ email: 'admin@akxton.com' });
            const kitchenUser = await User.findOne({ email: 'chef@akxton.com' });
            
            const activityLogs = [
                {
                    userId: adminUser._id,
                    role: 'admin',
                    action: 'Added new menu item',
                    entityType: 'Menu',
                    entityId: 'BBQ_Chicken_Pizza'
                },
                {
                    userId: kitchenUser._id,
                    role: 'kitchen',
                    action: 'Updated order status to Preparing',
                    entityType: 'Order',
                    entityId: 'order_table_2'
                },
                {
                    userId: adminUser._id,
                    role: 'admin',
                    action: 'Inventory level updated',
                    entityType: 'Inventory',
                    entityId: 'Chicken_Breast'
                },
                {
                    userId: kitchenUser._id,
                    role: 'kitchen',
                    action: 'Order marked as Ready',
                    entityType: 'Order',
                    entityId: 'order_table_1'
                },
                {
                    userId: adminUser._id,
                    role: 'admin',
                    action: 'Added new table to restaurant',
                    entityType: 'Table',
                    entityId: 'table_7'
                },
                {
                    userId: kitchenUser._id,
                    role: 'kitchen',
                    action: 'Viewed pending orders',
                    entityType: 'Order',
                    entityId: 'pending_orders'
                }
            ];

            await ActivityLog.insertMany(activityLogs);
            console.log(`✅ Seeded ${activityLogs.length} activity logs\n`);
        } else {
            console.log(`✅ Activity logs already exist (${existingLogs})\n`);
        }

        console.log('═════════════════════════════════════════');
        console.log('✅ 🎉 ENHANCED DATA SEEDING COMPLETED! 🎉');
        console.log('═════════════════════════════════════════\n');
        console.log('📊 Summary:');
        console.log(`   • Inventory Items: ${inventoryItems.length}`);
        console.log(`   • Menu Items: ${menuItems.length}`);
        console.log(`   • Demo Users: ${users.length}`);
        console.log(`   • Restaurant Tables: 6`);
        console.log(`   • Sample Orders: 6`);
        console.log(`   • Activity Logs: 6\n`);
        console.log('🔑 Login Credentials:');
        console.log('   Admin: admin@akxton.com / admin123');
        console.log('   Chef: chef@akxton.com / chef123');
        console.log('   Waiter: waiter@akxton.com / waiter123');
        console.log('   Customer: guest@akxton.com / guest123\n');

        process.exit(0);
    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
};

seedEnhancedData();
