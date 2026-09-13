const express = require('express');
const router = express.Router();
const { getHistoricalDemand, predictDemand, getRestockSuggestions } = require('../controllers/forecastController');

// GET /api/forecast/demand?date=YYYY-MM-DD — Predict demand for a specific date
router.get('/demand', predictDemand);

// GET /api/forecast/restock — Restock suggestions based on 3-day forecast
router.get('/restock', getRestockSuggestions);

// GET /api/forecast/historical — Historical demand data (last 30 days)
router.get('/historical', getHistoricalDemand);

module.exports = router;
