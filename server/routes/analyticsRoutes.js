const express = require('express');
const { getDashboardStats, getSalesTrends, getTopItems, getSalesOverview, getAIInsights } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Restrict all business analytics to authenticated admins
router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/trends', getSalesTrends);
router.get('/top-items', getTopItems);
router.get('/sales-overview', getSalesOverview);
router.get('/insights', getAIInsights);

module.exports = router;
