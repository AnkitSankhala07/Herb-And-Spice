const express = require('express');
const router = express.Router();
const { generateDailyReport, generateMonthlyReport, exportOrders, generateCustomerBill, generateTableBill } = require('../controllers/reportController');
const { protect, adminOnly, authorize } = require('../middleware/authMiddleware');

// Administrative business reports
router.get('/daily', protect, adminOnly, generateDailyReport);
router.get('/monthly', protect, adminOnly, generateMonthlyReport);
router.get('/export', protect, adminOnly, exportOrders);

// Staff billing generation (Admin & Waiter)
router.get('/bill/:id', protect, authorize('admin', 'waiter'), generateCustomerBill);
router.get('/bill/table/:tableId', protect, authorize('admin', 'waiter'), generateTableBill);

module.exports = router;
