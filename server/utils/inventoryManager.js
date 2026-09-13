const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const MenuItem = require('../models/MenuItem');

/**
 * Checks if a specific menu item has sufficient stock for ALL its ingredients.
 * @param {Object} menuItem - The MenuItem document (should have populated ingredients if possible, otherwise we fetch).
 * @param {Number} quantityOrdered - Quantity of the menu item ordered.
 * @returns {Promise<boolean>} - True if available, False otherwise.
 */
const checkItemStock = async (menuItem, quantityOrdered = 1) => {
    // If ingredients are not populated/loaded, we might need to handle that, 
    // but typically we expect them to be in the object or we fetch them.
    // For safety, let's assume we need to check the DB for current stock levels.

    if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
        return true; // No ingredients listed ?? Default to available.
    }

    for (const ing of menuItem.ingredients) {
        const inventoryItem = await Inventory.findById(ing.ingredientId);
        if (!inventoryItem) {
            // If ingredient not found in DB, arguably we should disable or treat as 0 stock.
            // Let's treat as 0 stock -> Unavailable.
            return false;
        }

        const requiredAmount = ing.quantityRequired * quantityOrdered;
        if (inventoryItem.quantity < requiredAmount) {
            return false;
        }
    }

    return true;
};

/**
 * Updates the `isAvailable` status of a single MenuItem based on current inventory.
 * @param {String|Object} menuItemOrId - The MenuItem ID or document.
 */
const updateMenuItemDetails = async (menuItemOrId) => {
    let menuItem;
    if (typeof menuItemOrId === 'string' || menuItemOrId instanceof String) {
        menuItem = await MenuItem.findById(menuItemOrId);
    } else {
        menuItem = menuItemOrId;
    }

    if (!menuItem) return;

    // Check availability for exactly 1 unit
    const isAvailable = await checkItemStock(menuItem, 1);

    if (menuItem.isAvailable !== isAvailable) {
        menuItem.isAvailable = isAvailable;
        await menuItem.save();
        console.log(`[InventoryManager] Auto-updated ${menuItem.name} availability to ${isAvailable}`);
    }

    return isAvailable;
};

/**
 * Updates ALL MenuItems' availability. 
 * Should be called after massive inventory updates or at startup.
 */
const syncAllMenuItems = async () => {
    const menuItems = await MenuItem.find({});
    for (const item of menuItems) {
        await updateMenuItemDetails(item);
    }
};

/**
 * Deducts inventory for a list of Order Items.
 * @param {Array} orderItems - Array of objects { menuItemId, quantity, name }
 * @throws Error if stock is insufficient (Hard Check).
 */
const deductInventoryForOrder = async (orderItems) => {
    // 1. HARD SAFETY CHECK & ATOMIC DEDUCTION
    // In a high-concurrency environment, checking then updating is unsafe.
    // We attempt to deduct immediately. If any deduction fails, we must ROLLBACK.

    const deductedOperations = []; // To track for rollback

    try {
        for (const item of orderItems) {
            let menuItem;
            const itemId = item.menuItemId || item.menuItem;
            if (itemId && mongoose.Types.ObjectId.isValid(itemId)) {
                menuItem = await MenuItem.findById(itemId);
            } else if (item.name) {
                menuItem = await MenuItem.findOne({ name: item.name });
            }

            if (menuItem && menuItem.ingredients) {
                for (const ing of menuItem.ingredients) {
                    const totalDeduct = ing.quantityRequired * (item.quantity || 1);

                    // ATOMIC UPDATE: Only update if we have enough quantity
                    const result = await Inventory.findOneAndUpdate(
                        { _id: ing.ingredientId, quantity: { $gte: totalDeduct } },
                        { $inc: { quantity: -totalDeduct } },
                        { new: true }
                    );

                    if (!result) {
                        throw new Error(`Insufficient stock for ingredient ID: ${ing.ingredientId} (Item: ${menuItem.name})`);
                    }

                    deductedOperations.push({ id: ing.ingredientId, amount: totalDeduct });
                }
            }
        }
    } catch (error) {
        // ROLLBACK IF FAILURE
        console.error("Inventory deduction failed, rolling back...", error.message);
        for (const op of deductedOperations) {
            await Inventory.findByIdAndUpdate(op.id, { $inc: { quantity: op.amount } });
        }
        throw new Error("Insufficient stock to complete order. Please try again.");
    }

    // 2. TRIGGER AUTO-DISABLE CHECK (Optimistic)
    // We don't await this to keep response fast, or we await if we want strict consistency.
    // For critical business logic, let's await it.
    await syncAllMenuItems();
};

module.exports = {
    checkItemStock,
    updateMenuItemDetails,
    syncAllMenuItems,
    deductInventoryForOrder
};
