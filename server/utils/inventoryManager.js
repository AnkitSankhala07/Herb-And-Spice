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
    try {
        const [menuItems, inventoryList] = await Promise.all([
            MenuItem.find({}),
            Inventory.find({})
        ]);
        const invMap = new Map(inventoryList.map(inv => [inv._id.toString(), inv]));

        for (const item of menuItems) {
            if (!item.ingredients || item.ingredients.length === 0) continue;
            let available = true;
            for (const ing of item.ingredients) {
                const inv = invMap.get(ing.ingredientId?.toString());
                if (!inv || inv.quantity < (ing.quantityRequired || 1)) {
                    available = false;
                    break;
                }
            }
            if (item.isAvailable !== available) {
                item.isAvailable = available;
                await item.save();
                console.log(`[InventoryManager] Auto-updated ${item.name} availability to ${available}`);
            }
        }
    } catch (err) {
        console.error('[InventoryManager] syncAllMenuItems error:', err.message);
    }
};

/**
 * Deducts inventory for a list of Order Items.
 * @param {Array} orderItems - Array of objects { menuItemId, quantity, name }
 * @throws Error if stock is insufficient (Hard Check).
 */
const deductInventoryForOrder = async (orderItems) => {
    // 1. HARD SAFETY CHECK & ATOMIC DEDUCTION
    const deductedOperations = []; // To track for rollback
    const ingredientDeductions = new Map(); // ingredientId -> { totalDeduct, itemName }

    for (const item of orderItems) {
        let ingredients = item.ingredients;
        let itemName = item.name;

        if (!ingredients) {
            const itemId = item.menuItemId || item.menuItem;
            let menuItem = null;
            if (itemId && mongoose.Types.ObjectId.isValid(itemId)) {
                menuItem = await MenuItem.findById(itemId);
            } else if (item.name) {
                menuItem = await MenuItem.findOne({ name: item.name });
            }
            if (menuItem) {
                ingredients = menuItem.ingredients;
                itemName = menuItem.name;
            }
        }

        if (ingredients && ingredients.length > 0) {
            for (const ing of ingredients) {
                const idStr = ing.ingredientId?.toString();
                if (!idStr) continue;
                const totalDeduct = (ing.quantityRequired || 1) * (item.quantity || 1);
                const current = ingredientDeductions.get(idStr) || { totalDeduct: 0, itemName };
                current.totalDeduct += totalDeduct;
                ingredientDeductions.set(idStr, current);
            }
        }
    }

    try {
        // Execute atomic deductions concurrently in parallel
        await Promise.all(
            Array.from(ingredientDeductions.entries()).map(async ([ingredientId, { totalDeduct, itemName }]) => {
                const result = await Inventory.findOneAndUpdate(
                    { _id: ingredientId, quantity: { $gte: totalDeduct } },
                    { $inc: { quantity: -totalDeduct } },
                    { new: true }
                );

                if (!result) {
                    throw new Error(`Insufficient stock for ingredient ID: ${ingredientId} (Item: ${itemName})`);
                }

                deductedOperations.push({ id: ingredientId, amount: totalDeduct });
            })
        );
    } catch (error) {
        // ROLLBACK IF FAILURE
        console.error("Inventory deduction failed, rolling back...", error.message);
        await Promise.all(
            deductedOperations.map(op => Inventory.findByIdAndUpdate(op.id, { $inc: { quantity: op.amount } }))
        );
        throw new Error("Insufficient stock to complete order. Please try again.");
    }

    // 2. TRIGGER AUTO-DISABLE CHECK ASYNCHRONOUSLY
    // Executed via setImmediate so client receives instant order confirmation without blocking on DB iteration
    setImmediate(() => {
        syncAllMenuItems().catch(err => console.error('[InventoryManager] async sync error:', err.message));
    });
};

module.exports = {
    checkItemStock,
    updateMenuItemDetails,
    syncAllMenuItems,
    deductInventoryForOrder
};
