const express = require('express');
const { getInventory, updateStock, addInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStockItems, seedInventory } = require('../controllers/inventoryController');
const { protect, adminOnly, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Kitchen and Admin can view inventory and low-stock alerts
router.get('/low-stock', protect, authorize('admin', 'kitchen'), getLowStockItems);
router.post('/seed', protect, adminOnly, seedInventory);

router.route('/')
    .get(protect, authorize('admin', 'kitchen'), getInventory)
    .post(protect, adminOnly, addInventoryItem);

router.route('/:id')
    .put(protect, authorize('admin', 'kitchen'), updateInventoryItem)
    .delete(protect, adminOnly, deleteInventoryItem);

module.exports = router;
