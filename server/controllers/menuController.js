const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');

// @desc    Get All Menu Items
// @route   GET /api/menu
const getMenuItems = async (req, res) => {
    try {
        // Find all items
        // We might want to filter active/inactive but for now return all so Admin can see Disabled ones
        const items = await MenuItem.find({}).populate('ingredients.ingredientId');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching menu' });
        console.error(error);
    }
};

// @desc    Seed Menu Items (For Demo)
// @route   POST /api/menu/seed
const seedMenu = async (req, res) => {
    try {
        await MenuItem.deleteMany({}); // Clear existing

        const cheese = await Inventory.findOne({ name: 'Cheese' });
        const tomato = await Inventory.findOne({ name: 'Tomato' });
        const bun = await Inventory.findOne({ name: 'Burger Bun' });
        const patty = await Inventory.findOne({ name: 'Chicken Patty' });

        // If inventory not seeded yet, we can't link
        if (!cheese || !tomato) {
            return res.status(400).json({ message: 'Please seed Inventory first!' });
        }

        const menuItems = [
            {
                name: 'Classic Burger',
                category: 'Burgers',
                price: 150,
                imageUrl: 'https://source.unsplash.com/1600x900/?burger',
                isVeg: false,
                ingredients: [
                    { ingredientId: bun._id, quantityRequired: 1 },
                    { ingredientId: patty ? patty._id : null, quantityRequired: 1 },
                    { ingredientId: cheese._id, quantityRequired: 0.1 },
                    { ingredientId: tomato._id, quantityRequired: 0.1 }
                ].filter(i => i.ingredientId), // Filter out missing ingredients
                description: 'The classic juicy burger with cheese and fresh veggies.',
                popularityScore: 95
            },
            {
                name: 'Margherita Pizza',
                category: 'Pizza',
                price: 250,
                imageUrl: 'https://source.unsplash.com/1600x900/?pizza',
                isVeg: true,
                ingredients: [
                    { ingredientId: cheese._id, quantityRequired: 0.2 },
                    { ingredientId: tomato._id, quantityRequired: 0.2 }
                ],
                description: 'Classic cheese and tomato pizza.',
                popularityScore: 88,
                isAvailable: true
            },
            {
                name: 'Cheese Fries',
                category: 'Sides',
                price: 120,
                imageUrl: 'https://source.unsplash.com/1600x900/?fries',
                isVeg: true,
                ingredients: [
                    { ingredientId: cheese._id, quantityRequired: 0.1 },
                    { ingredientId: tomato._id, quantityRequired: 0.05 } // Ketchup/sauce?
                ],
                description: 'Crispy fries topped with melted cheese.',
                popularityScore: 80
            }
        ];

        const createdItems = await MenuItem.insertMany(menuItems);
        res.status(201).json(createdItems);

    } catch (error) {
        res.status(500).json({ message: 'Error seeding menu', error: error.message });
        console.error(error);
    }
};

// @desc    Add a new Menu Item
// @route   POST /api/menu
const addMenuItem = async (req, res) => {
    try {
        const { name, category, price, imageUrl, isVeg, ingredients, description, isAvailable } = req.body;

        const newItem = new MenuItem({
            name,
            category,
            price,
            imageUrl,
            isVeg,
            ingredients,
            description,
            isAvailable
        });

        const createdItem = await newItem.save();
        res.status(201).json(createdItem);
    } catch (error) {
        res.status(500).json({ message: 'Error adding menu item', error: error.message });
        console.error(error);
    }
};

// @desc    Update a Menu Item
// @route   PUT /api/menu/:id
const updateMenuItem = async (req, res) => {
    try {
        const { name, category, price, imageUrl, isVeg, ingredients, description, isAvailable } = req.body;
        const item = await MenuItem.findById(req.params.id);

        if (item) {
            item.name = name || item.name;
            item.category = category || item.category;
            item.price = price || item.price;
            item.imageUrl = imageUrl || item.imageUrl;
            item.isVeg = isVeg !== undefined ? isVeg : item.isVeg;
            item.ingredients = ingredients || item.ingredients;
            item.description = description || item.description;
            item.isAvailable = isAvailable !== undefined ? isAvailable : item.isAvailable;

            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Menu item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating menu item', error: error.message });
        console.error(error);
    }
};

// @desc    Delete a Menu Item
// @route   DELETE /api/menu/:id
const deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);

        if (item) {
            await item.deleteOne();
            res.json({ message: 'Menu item removed' });
        } else {
            res.status(404).json({ message: 'Menu item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item', error: error.message });
        console.error(error);
    }
};

module.exports = { getMenuItems, seedMenu, addMenuItem, updateMenuItem, deleteMenuItem };
