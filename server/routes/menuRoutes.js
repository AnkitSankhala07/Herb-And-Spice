const express = require('express');
const router = express.Router();
const { getMenuItems, seedMenu, addMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public access for digital menu browsing
router.get('/', getMenuItems);

// Admin-only management
router.post('/', protect, adminOnly, addMenuItem);
router.put('/:id', protect, adminOnly, updateMenuItem);
router.delete('/:id', protect, adminOnly, deleteMenuItem);
router.post('/seed', protect, adminOnly, seedMenu);

module.exports = router;
