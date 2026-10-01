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
        const { seedDatabase } = require('../seedSampleData');
        const stats = await seedDatabase();

        const items = await MenuItem.find({}).populate('ingredients.ingredientId');
        res.status(200).json({ message: 'Menu and inventory seeded successfully', stats, items });
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
