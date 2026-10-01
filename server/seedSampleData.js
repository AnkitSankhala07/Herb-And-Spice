const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Inventory = require('./models/Inventory');
const MenuItem = require('./models/MenuItem');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartresto');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

const sampleInventory = [
    // Breads & Bases
    { name: 'Burger Bun', quantity: 120, unit: 'pcs', threshold: 25 },
    { name: 'Pizza Base (10 inch)', quantity: 60, unit: 'pcs', threshold: 15 },
    { name: 'Artisan Bread', quantity: 50, unit: 'pcs', threshold: 12 },
    { name: 'Garlic Naan', quantity: 40, unit: 'pcs', threshold: 8 },

    // Proteins
    { name: 'Chicken Breast', quantity: 85, unit: 'pcs', threshold: 15 },
    { name: 'Chicken Patty', quantity: 60, unit: 'pcs', threshold: 12 },
    { name: 'Mutton Patty', quantity: 45, unit: 'pcs', threshold: 10 },
    { name: 'Fish Fillet', quantity: 50, unit: 'pcs', threshold: 10 },
    { name: 'Paneer', quantity: 35, unit: 'kg', threshold: 5 },

    // Dairy & Cheeses
    { name: 'Cheddar Cheese Slice', quantity: 180, unit: 'pcs', threshold: 30 },
    { name: 'Mozzarella Cheese Block', quantity: 25, unit: 'kg', threshold: 5 },
    { name: 'Parmesan Cheese', quantity: 8, unit: 'kg', threshold: 2 },
    { name: 'Butter', quantity: 15, unit: 'kg', threshold: 3 },
    { name: 'Fresh Milk', quantity: 60, unit: 'liters', threshold: 12 },
    { name: 'Fresh Cream', quantity: 10, unit: 'liters', threshold: 2 },

    // Produce & Veggies
    { name: 'Fresh Tomato', quantity: 55, unit: 'kg', threshold: 10 },
    { name: 'Red Onion', quantity: 60, unit: 'kg', threshold: 12 },
    { name: 'Crisp Romaine Lettuce', quantity: 22, unit: 'kg', threshold: 5 },
    { name: 'Cucumber', quantity: 18, unit: 'kg', threshold: 4 },
    { name: 'Bell Pepper', quantity: 20, unit: 'kg', threshold: 4 },
    { name: 'Fresh Mushroom', quantity: 12, unit: 'kg', threshold: 3 },
    { name: 'Jalapenos', quantity: 10, unit: 'kg', threshold: 2 },
    { name: 'Russet Potato', quantity: 120, unit: 'kg', threshold: 25 },
    { name: 'Garlic Paste', quantity: 5, unit: 'kg', threshold: 1 },
    { name: 'Fresh Mint & Lime', quantity: 8, unit: 'kg', threshold: 2 },

    // Sauces & Condiments
    { name: 'Pizza Sauce', quantity: 15, unit: 'liters', threshold: 3 },
    { name: 'Mayonnaise', quantity: 10, unit: 'liters', threshold: 2 },
    { name: 'BBQ Sauce', quantity: 8, unit: 'liters', threshold: 2 },
    { name: 'Chili Sauce', quantity: 8, unit: 'liters', threshold: 2 },

    // Beverages & Sweets
    { name: 'Arabica Coffee Beans', quantity: 12, unit: 'kg', threshold: 2 },
    { name: 'Assam Tea Leaves', quantity: 6, unit: 'kg', threshold: 1 },
    { name: 'Refined Sugar', quantity: 30, unit: 'kg', threshold: 5 },
    { name: 'Cocoa Powder', quantity: 5, unit: 'kg', threshold: 1 },
    { name: 'Caramel Syrup', quantity: 6, unit: 'liters', threshold: 1 },
    { name: 'Chocolate Syrup', quantity: 10, unit: 'liters', threshold: 2 },
    { name: 'Vanilla Bean Ice Cream', quantity: 25, unit: 'tubs', threshold: 5 },
    { name: 'Fresh Strawberries', quantity: 10, unit: 'kg', threshold: 2 },
    { name: 'Soda Water', quantity: 80, unit: 'bottles', threshold: 20 }
];

const seedDatabase = async () => {
    await connectDB();

    try {
        console.log('🔄 Upserting sample inventory items...');
        for (const item of sampleInventory) {
            await Inventory.findOneAndUpdate(
                { name: item.name },
                { ...item, lastRestocked: new Date() },
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Upserted ${sampleInventory.length} inventory items successfully!`);

        // Fetch all inventory items to get IDs
        const allInv = await Inventory.find({});
        const invMap = {};
        allInv.forEach(i => {
            invMap[i.name] = i._id;
        });

        const getInvId = (name) => invMap[name] || null;

        const sampleMenuItems = [
            // ===== BURGERS =====
            {
                name: 'Classic Gourmet Cheeseburger',
                category: 'Burgers',
                price: 199,
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
                description: 'Succulent grilled chicken patty layered with aged cheddar, crisp lettuce, ripe tomato and secret house mayo.',
                isVeg: false,
                popularityScore: 95,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Chicken Patty'), quantityRequired: 1 },
                    { ingredientId: getInvId('Cheddar Cheese Slice'), quantityRequired: 1 },
                    { ingredientId: getInvId('Fresh Tomato'), quantityRequired: 0.05 },
                    { ingredientId: getInvId('Crisp Romaine Lettuce'), quantityRequired: 0.03 },
                    { ingredientId: getInvId('Mayonnaise'), quantityRequired: 0.02 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Smoky BBQ Bacon & Chicken Burger',
                category: 'Burgers',
                price: 249,
                imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
                description: 'Tender chicken breast smothered in hickory BBQ sauce with melted cheese and caramelized red onions.',
                isVeg: false,
                popularityScore: 92,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Chicken Breast'), quantityRequired: 1 },
                    { ingredientId: getInvId('Cheddar Cheese Slice'), quantityRequired: 1 },
                    { ingredientId: getInvId('BBQ Sauce'), quantityRequired: 0.04 },
                    { ingredientId: getInvId('Red Onion'), quantityRequired: 0.03 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Royal Paneer Crunch Burger',
                category: 'Burgers',
                price: 179,
                imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc4e5c90b133?auto=format&fit=crop&w=800&q=80',
                description: 'Golden spiced panko paneer steak with crisp shredded romaine lettuce and zesty chili-mayo dressing.',
                isVeg: true,
                popularityScore: 90,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Paneer'), quantityRequired: 0.12 },
                    { ingredientId: getInvId('Crisp Romaine Lettuce'), quantityRequired: 0.04 },
                    { ingredientId: getInvId('Mayonnaise'), quantityRequired: 0.02 },
                    { ingredientId: getInvId('Chili Sauce'), quantityRequired: 0.01 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Fiery Mutton Double Delight Burger',
                category: 'Burgers',
                price: 299,
                imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
                description: 'Char-grilled mutton patty with pickled jalapenos, double melted cheese slice, and fiery house chili glaze.',
                isVeg: false,
                popularityScore: 89,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Mutton Patty'), quantityRequired: 1 },
                    { ingredientId: getInvId('Cheddar Cheese Slice'), quantityRequired: 2 },
                    { ingredientId: getInvId('Jalapenos'), quantityRequired: 0.03 },
                    { ingredientId: getInvId('Chili Sauce'), quantityRequired: 0.02 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Crispy Coastal Fish Fillet Burger',
                category: 'Burgers',
                price: 229,
                imageUrl: 'https://images.unsplash.com/photo-1572440514411-007ad94543e5?auto=format&fit=crop&w=800&q=80',
                description: 'Crisp golden batter-fried fish fillet topped with fresh herbs, tartar mayonnaise, and creamy cheddar.',
                isVeg: false,
                popularityScore: 86,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Burger Bun'), quantityRequired: 1 },
                    { ingredientId: getInvId('Fish Fillet'), quantityRequired: 1 },
                    { ingredientId: getInvId('Cheddar Cheese Slice'), quantityRequired: 1 },
                    { ingredientId: getInvId('Mayonnaise'), quantityRequired: 0.03 }
                ].filter(i => i.ingredientId)
            },

            // ===== PIZZAS =====
            {
                name: 'Artisan Margherita Pizza',
                category: 'Pizza',
                price: 299,
                imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
                description: 'Classic stone-baked crust layered with rich San Marzano tomato sauce, fresh buffalo mozzarella, and aromatic basil.',
                isVeg: true,
                popularityScore: 96,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base (10 inch)'), quantityRequired: 1 },
                    { ingredientId: getInvId('Pizza Sauce'), quantityRequired: 0.08 },
                    { ingredientId: getInvId('Mozzarella Cheese Block'), quantityRequired: 0.15 },
                    { ingredientId: getInvId('Fresh Tomato'), quantityRequired: 0.05 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Smoky Tandoori Chicken Tikka Pizza',
                category: 'Pizza',
                price: 389,
                imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
                description: 'Charcoal-infused spiced chicken chunks, bell peppers, crunchy red onions, and abundant stringy mozzarella.',
                isVeg: false,
                popularityScore: 94,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base (10 inch)'), quantityRequired: 1 },
                    { ingredientId: getInvId('Pizza Sauce'), quantityRequired: 0.08 },
                    { ingredientId: getInvId('Chicken Breast'), quantityRequired: 0.15 },
                    { ingredientId: getInvId('Mozzarella Cheese Block'), quantityRequired: 0.14 },
                    { ingredientId: getInvId('Bell Pepper'), quantityRequired: 0.04 },
                    { ingredientId: getInvId('Red Onion'), quantityRequired: 0.04 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Garden Fresh Veggie Supreme Pizza',
                category: 'Pizza',
                price: 339,
                imageUrl: 'https://images.unsplash.com/photo-1564982752979-3f937ebc4b19?auto=format&fit=crop&w=800&q=80',
                description: 'Loaded with bell peppers, sliced button mushrooms, black olives, jalapenos, and melted golden mozzarella.',
                isVeg: true,
                popularityScore: 91,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base (10 inch)'), quantityRequired: 1 },
                    { ingredientId: getInvId('Pizza Sauce'), quantityRequired: 0.08 },
                    { ingredientId: getInvId('Mozzarella Cheese Block'), quantityRequired: 0.14 },
                    { ingredientId: getInvId('Bell Pepper'), quantityRequired: 0.05 },
                    { ingredientId: getInvId('Fresh Mushroom'), quantityRequired: 0.05 },
                    { ingredientId: getInvId('Jalapenos'), quantityRequired: 0.03 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Quattro Formaggi (Four Cheese) Pizza',
                category: 'Pizza',
                price: 419,
                imageUrl: 'https://images.unsplash.com/photo-1573821663912-b5164b4c6bb8?auto=format&fit=crop&w=800&q=80',
                description: 'A luxurious blend of mozzarella, aged cheddar, parmesan shavings, and velvety cream sauce.',
                isVeg: true,
                popularityScore: 93,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Pizza Base (10 inch)'), quantityRequired: 1 },
                    { ingredientId: getInvId('Mozzarella Cheese Block'), quantityRequired: 0.12 },
                    { ingredientId: getInvId('Cheddar Cheese Slice'), quantityRequired: 2 },
                    { ingredientId: getInvId('Parmesan Cheese'), quantityRequired: 0.04 },
                    { ingredientId: getInvId('Fresh Cream'), quantityRequired: 0.05 }
                ].filter(i => i.ingredientId)
            },

            // ===== STARTERS & SIDES =====
            {
                name: 'Golden Herb Crispy French Fries',
                category: 'Sides',
                price: 129,
                imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80',
                description: 'Crispy hand-cut russet potato fries tossed in rosemary sea salt and served with tangy dipping sauce.',
                isVeg: true,
                popularityScore: 97,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Russet Potato'), quantityRequired: 0.3 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Loaded Melted Cheese Fries',
                category: 'Sides',
                price: 189,
                imageUrl: 'https://images.unsplash.com/photo-1518080527399-a578d36cde12?auto=format&fit=crop&w=800&q=80',
                description: 'Hot golden fries drenched in molten cheddar cheese sauce and garnished with spicy jalapenos.',
                isVeg: true,
                popularityScore: 94,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Russet Potato'), quantityRequired: 0.3 },
                    { ingredientId: getInvId('Cheddar Cheese Slice'), quantityRequired: 2 },
                    { ingredientId: getInvId('Jalapenos'), quantityRequired: 0.02 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Artisan Cheesy Garlic Bread',
                category: 'Sides',
                price: 159,
                imageUrl: 'https://images.unsplash.com/photo-1599599810694-d6212dc1add8?auto=format&fit=crop&w=800&q=80',
                description: 'Warm toasted crusty bread infused with roasted garlic butter and bubbly melted mozzarella.',
                isVeg: true,
                popularityScore: 92,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Artisan Bread'), quantityRequired: 1 },
                    { ingredientId: getInvId('Butter'), quantityRequired: 0.03 },
                    { ingredientId: getInvId('Garlic Paste'), quantityRequired: 0.02 },
                    { ingredientId: getInvId('Mozzarella Cheese Block'), quantityRequired: 0.06 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Classic Parmesan Caesar Salad',
                category: 'Starters',
                price: 199,
                imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80',
                description: 'Crisp romaine ribbons, shaved parmesan reggiano, golden croutons, and authentic creamy Caesar dressing.',
                isVeg: true,
                popularityScore: 88,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Crisp Romaine Lettuce'), quantityRequired: 0.15 },
                    { ingredientId: getInvId('Parmesan Cheese'), quantityRequired: 0.04 },
                    { ingredientId: getInvId('Artisan Bread'), quantityRequired: 0.5 },
                    { ingredientId: getInvId('Mayonnaise'), quantityRequired: 0.04 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Crispy Panko Onion Rings',
                category: 'Sides',
                price: 139,
                imageUrl: 'https://images.unsplash.com/photo-1639024471869-c0adf9893922?auto=format&fit=crop&w=800&q=80',
                description: 'Thick sweet onion rings dipped in seasoned batter and panko breadcrumbs, fried to golden perfection.',
                isVeg: true,
                popularityScore: 85,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Red Onion'), quantityRequired: 0.25 },
                    { ingredientId: getInvId('Mayonnaise'), quantityRequired: 0.02 }
                ].filter(i => i.ingredientId)
            },

            // ===== SANDWICHES =====
            {
                name: 'Gourmet Grilled Chicken Club Sandwich',
                category: 'Sandwiches',
                price: 199,
                imageUrl: 'https://images.unsplash.com/photo-1553909990-fb05bff718b7?auto=format&fit=crop&w=800&q=80',
                description: 'Three tiers of toasted artisan bread stuffed with herb-marinated grilled chicken, cheddar, tomatoes, and crisp lettuce.',
                isVeg: false,
                popularityScore: 91,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Artisan Bread'), quantityRequired: 2 },
                    { ingredientId: getInvId('Chicken Breast'), quantityRequired: 0.12 },
                    { ingredientId: getInvId('Cheddar Cheese Slice'), quantityRequired: 1 },
                    { ingredientId: getInvId('Fresh Tomato'), quantityRequired: 0.04 },
                    { ingredientId: getInvId('Crisp Romaine Lettuce'), quantityRequired: 0.03 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Paneer Tikka Panini Sandwich',
                category: 'Sandwiches',
                price: 169,
                imageUrl: 'https://images.unsplash.com/photo-1585238341710-4913dfdc3161?auto=format&fit=crop&w=800&q=80',
                description: 'Spiced tandoori cottage cheese cubes, grilled peppers, and mint mayonnaise pressed in warm panini bread.',
                isVeg: true,
                popularityScore: 89,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Artisan Bread'), quantityRequired: 2 },
                    { ingredientId: getInvId('Paneer'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Bell Pepper'), quantityRequired: 0.04 },
                    { ingredientId: getInvId('Mayonnaise'), quantityRequired: 0.02 }
                ].filter(i => i.ingredientId)
            },

            // ===== DRINKS =====
            {
                name: 'Velvet Silk Cappuccino',
                category: 'Drinks',
                price: 149,
                imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
                description: 'Freshly pulled double espresso shot with steamed micro-foam milk and a gentle dusting of cocoa powder.',
                isVeg: true,
                popularityScore: 95,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Arabica Coffee Beans'), quantityRequired: 0.02 },
                    { ingredientId: getInvId('Fresh Milk'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('Cocoa Powder'), quantityRequired: 0.005 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Iced Caramel Macchiato',
                category: 'Drinks',
                price: 189,
                imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
                description: 'Chilled Arabica espresso layered over cold milk and finished with rich buttery caramel drizzle.',
                isVeg: true,
                popularityScore: 94,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Arabica Coffee Beans'), quantityRequired: 0.02 },
                    { ingredientId: getInvId('Fresh Milk'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('Caramel Syrup'), quantityRequired: 0.03 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Royal Spiced Masala Chai',
                category: 'Drinks',
                price: 79,
                imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
                description: 'Slow-simmered Assam black tea with crushed cardamom, fresh ginger, cinnamon and whole milk.',
                isVeg: true,
                popularityScore: 98,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Assam Tea Leaves'), quantityRequired: 0.015 },
                    { ingredientId: getInvId('Fresh Milk'), quantityRequired: 0.15 },
                    { ingredientId: getInvId('Refined Sugar'), quantityRequired: 0.015 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Fresh Mint Lime Mojito',
                category: 'Drinks',
                price: 139,
                imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80',
                description: 'Muddled fresh mint leaves, tart key lime juice, sparkling soda water and chilled ice crystals.',
                isVeg: true,
                popularityScore: 93,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Fresh Mint & Lime'), quantityRequired: 0.05 },
                    { ingredientId: getInvId('Soda Water'), quantityRequired: 1 },
                    { ingredientId: getInvId('Refined Sugar'), quantityRequired: 0.02 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Belgian Hot Chocolate',
                category: 'Drinks',
                price: 159,
                imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80',
                description: 'Rich dark Belgian cocoa melted with whole milk and topped with fluffy whipped cream.',
                isVeg: true,
                popularityScore: 89,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Cocoa Powder'), quantityRequired: 0.03 },
                    { ingredientId: getInvId('Fresh Milk'), quantityRequired: 0.2 },
                    { ingredientId: getInvId('Fresh Cream'), quantityRequired: 0.03 },
                    { ingredientId: getInvId('Refined Sugar'), quantityRequired: 0.02 }
                ].filter(i => i.ingredientId)
            },

            // ===== DESSERTS =====
            {
                name: 'Molten Belgian Chocolate Lava Cake',
                category: 'Desserts',
                price: 189,
                imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80',
                description: 'Decadent dark chocolate soufflé cake with a warm flowing fudge center, served with vanilla ice cream.',
                isVeg: true,
                popularityScore: 97,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Cocoa Powder'), quantityRequired: 0.04 },
                    { ingredientId: getInvId('Chocolate Syrup'), quantityRequired: 0.05 },
                    { ingredientId: getInvId('Vanilla Bean Ice Cream'), quantityRequired: 0.1 },
                    { ingredientId: getInvId('Butter'), quantityRequired: 0.02 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'Madagascar Vanilla Bean Sundae',
                category: 'Desserts',
                price: 149,
                imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
                description: 'Three scoops of aromatic vanilla bean ice cream drenched in warm dark chocolate fudge.',
                isVeg: true,
                popularityScore: 91,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Vanilla Bean Ice Cream'), quantityRequired: 0.25 },
                    { ingredientId: getInvId('Chocolate Syrup'), quantityRequired: 0.05 }
                ].filter(i => i.ingredientId)
            },
            {
                name: 'New York Strawberry Cheesecake',
                category: 'Desserts',
                price: 219,
                imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
                description: 'Velvety smooth baked cream cheese on a buttery graham crust, glazed with fresh strawberry coulis.',
                isVeg: true,
                popularityScore: 94,
                isAvailable: true,
                ingredients: [
                    { ingredientId: getInvId('Fresh Cream'), quantityRequired: 0.08 },
                    { ingredientId: getInvId('Fresh Strawberries'), quantityRequired: 0.06 },
                    { ingredientId: getInvId('Butter'), quantityRequired: 0.02 },
                    { ingredientId: getInvId('Refined Sugar'), quantityRequired: 0.03 }
                ].filter(i => i.ingredientId)
            }
        ];

        console.log('🔄 Upserting sample menu items...');
        for (const item of sampleMenuItems) {
            await MenuItem.findOneAndUpdate(
                { name: item.name },
                item,
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Upserted ${sampleMenuItems.length} menu items successfully!`);

        console.log('\n=========================================');
        console.log('🎉 Sample data seeding completed successfully!');
        console.log(`📦 Total Inventory Items: ${sampleInventory.length}`);
        console.log(`🍽️  Total Menu Items: ${sampleMenuItems.length}`);
        return { inventoryCount: sampleInventory.length, menuCount: sampleMenuItems.length };
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        throw err;
    }
};

if (require.main === module) {
    seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seedDatabase, sampleInventory };

