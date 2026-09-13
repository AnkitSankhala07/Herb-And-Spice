const express = require('express');
const { createOrder, getOrders, updateOrderStatus, markTablePaid } = require('../controllers/orderController');
const { protect, adminOnly, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Customer/Guest table ordering is public; viewing orders requires staff auth
router.route('/')
    .post(createOrder)
    .get(protect, authorize('admin', 'kitchen', 'waiter'), getOrders);

// Kitchen & Staff can update order status
router.route('/:id/status')
    .put(protect, authorize('admin', 'kitchen', 'waiter'), updateOrderStatus);

// Waiter & Admin can mark table paid
router.route('/table/:tableId/mark-paid')
    .put(protect, authorize('admin', 'waiter'), markTablePaid);

module.exports = router;
