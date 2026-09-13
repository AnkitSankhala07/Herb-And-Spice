const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');

// Helper: Get day name from date
const getDayOfWeek = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
};

// Helper: Get day number (0=Sunday, 6=Saturday)
const getDayNumber = (date) => new Date(date).getDay();

// @desc    Get Historical Demand (last 30 days, grouped by day_of_week + item)
// @route   GET /api/forecast/historical
const getHistoricalDemand = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const historicalData = await Order.aggregate([
            // Only completed/paid orders from last 30 days
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $nin: ['Cancelled'] }
                }
            },
            // Flatten items array
            { $unwind: '$items' },
            // Group by dayOfWeek + item name
            {
                $group: {
                    _id: {
                        dayOfWeek: { $dayOfWeek: '$createdAt' }, // 1=Sun, 7=Sat
                        itemName: '$items.name'
                    },
                    totalQuantity: { $sum: '$items.quantity' },
                    orderCount: { $sum: 1 },
                    maxQuantity: { $max: '$items.quantity' },
                    minQuantity: { $min: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            // Calculate averages
            {
                $project: {
                    _id: 0,
                    dayOfWeek: '$_id.dayOfWeek',
                    itemName: '$_id.itemName',
                    avgQuantity: { $round: [{ $divide: ['$totalQuantity', '$orderCount'] }, 1] },
                    totalQuantity: 1,
                    maxQuantity: 1,
                    minQuantity: 1,
                    orderCount: 1,
                    totalRevenue: { $round: ['$totalRevenue', 2] }
                }
            },
            { $sort: { dayOfWeek: 1, totalQuantity: -1 } }
        ]);

        // Map MongoDB dayOfWeek (1=Sun) to readable names
        const dayMap = { 1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday' };
        const formatted = historicalData.map(item => ({
            ...item,
            dayName: dayMap[item.dayOfWeek]
        }));

        // Also build a heatmap structure: { itemName: { dayOfWeek: avgQuantity } }
        const heatmap = {};
        formatted.forEach(item => {
            if (!heatmap[item.itemName]) {
                heatmap[item.itemName] = { itemName: item.itemName, Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
            }
            const shortDay = item.dayName.substring(0, 3);
            heatmap[item.itemName][shortDay] = item.avgQuantity;
        });

        res.json({
            raw: formatted,
            heatmap: Object.values(heatmap),
            totalItems: formatted.length,
            periodDays: 30
        });
    } catch (error) {
        console.error('Historical Demand Error:', error);
        res.status(500).json({ message: 'Failed to fetch historical demand data' });
    }
};

// @desc    Predict Demand for a given date
// @route   GET /api/forecast/demand?date=YYYY-MM-DD
const predictDemand = async (req, res) => {
    try {
        const targetDate = req.query.date ? new Date(req.query.date) : new Date(Date.now() + 86400000); // default tomorrow
        const targetDayOfWeek = targetDate.getDay() + 1; // MongoDB uses 1-indexed (1=Sun)
        const dayNames = { 1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday' };

        // --- Historical averages for the target dayOfWeek (last 30 days) ---
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const historicalAvg = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $nin: ['Cancelled'] }
                }
            },
            { $unwind: '$items' },
            // Filter only orders on the same dayOfWeek
            {
                $match: {
                    $expr: { $eq: [{ $dayOfWeek: '$createdAt' }, targetDayOfWeek] }
                }
            },
            {
                $group: {
                    _id: '$items.name',
                    avgQuantity: { $avg: '$items.quantity' },
                    totalQuantity: { $sum: '$items.quantity' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]);

        // --- Trend calculation: compare last week vs 2 weeks ago ---
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const [lastWeekSales, prevWeekSales] = await Promise.all([
            Order.aggregate([
                { $match: { createdAt: { $gte: oneWeekAgo }, status: { $nin: ['Cancelled'] } } },
                { $unwind: '$items' },
                { $group: { _id: '$items.name', total: { $sum: '$items.quantity' } } }
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo }, status: { $nin: ['Cancelled'] } } },
                { $unwind: '$items' },
                { $group: { _id: '$items.name', total: { $sum: '$items.quantity' } } }
            ])
        ]);

        // Build lookup maps
        const lastWeekMap = {};
        lastWeekSales.forEach(i => { lastWeekMap[i._id] = i.total; });
        const prevWeekMap = {};
        prevWeekSales.forEach(i => { prevWeekMap[i._id] = i.total; });

        // Build predictions with trend multiplier
        const predictions = historicalAvg.map(item => {
            const lastWeek = lastWeekMap[item._id] || 0;
            const prevWeek = prevWeekMap[item._id] || 0;

            // Trend multiplier calculation
            let trendMultiplier = 1;
            let trendDirection = 'stable';
            let trendPercent = 0;

            if (prevWeek > 0) {
                trendPercent = Math.round(((lastWeek - prevWeek) / prevWeek) * 100);
                if (trendPercent > 10) {
                    trendMultiplier = 1 + (trendPercent / 100);
                    trendDirection = 'up';
                } else if (trendPercent < -10) {
                    trendMultiplier = Math.max(0.5, 1 + (trendPercent / 100)); // Floor at 0.5x
                    trendDirection = 'down';
                }
            } else if (lastWeek > 0) {
                trendDirection = 'up';
                trendMultiplier = 1.1;
                trendPercent = 10;
            }

            const predictedQuantity = Math.round(item.avgQuantity * trendMultiplier);

            // Confidence based on data volume
            let confidence = Math.min(95, 50 + (item.orderCount * 5));

            return {
                itemName: item._id,
                predictedQuantity,
                avgQuantity: Math.round(item.avgQuantity * 10) / 10,
                confidence,
                trend: trendDirection,
                trendPercent,
                trendMultiplier: Math.round(trendMultiplier * 100) / 100,
                lastWeekSales: lastWeek,
                prevWeekSales: prevWeek
            };
        });

        res.json({
            targetDate: targetDate.toISOString().split('T')[0],
            dayOfWeek: dayNames[targetDayOfWeek],
            totalPredictedItems: predictions.length,
            predictions: predictions.sort((a, b) => b.predictedQuantity - a.predictedQuantity)
        });
    } catch (error) {
        console.error('Predict Demand Error:', error);
        res.status(500).json({ message: 'Failed to predict demand' });
    }
};

// @desc    Get Restock Suggestions based on 3-day forecast
// @route   GET /api/forecast/restock
const getRestockSuggestions = async (req, res) => {
    try {
        const days = 3;
        const predictions = [];

        // Get predictions for next 3 days
        for (let d = 1; d <= days; d++) {
            const targetDate = new Date(Date.now() + d * 86400000);
            const targetDayOfWeek = targetDate.getDay() + 1;

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const dayAvg = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo },
                        status: { $nin: ['Cancelled'] }
                    }
                },
                { $unwind: '$items' },
                {
                    $match: {
                        $expr: { $eq: [{ $dayOfWeek: '$createdAt' }, targetDayOfWeek] }
                    }
                },
                {
                    $group: {
                        _id: '$items.name',
                        avgQuantity: { $avg: '$items.quantity' }
                    }
                }
            ]);

            predictions.push(...dayAvg);
        }

        // Sum up predicted quantities per item across 3 days
        const itemDemand = {};
        predictions.forEach(p => {
            if (!itemDemand[p._id]) itemDemand[p._id] = 0;
            itemDemand[p._id] += p.avgQuantity;
        });

        // Find matching menu items to get ingredients
        const menuItems = await MenuItem.find({}).populate('ingredients.ingredientId');
        const inventory = await Inventory.find({});

        // Build inventory lookup
        const inventoryMap = {};
        inventory.forEach(inv => {
            inventoryMap[inv._id.toString()] = inv;
            inventoryMap[inv.name.toLowerCase()] = inv;
        });

        // Calculate required stock per ingredient (from demand forecast)
        const ingredientRequirements = {};

        menuItems.forEach(menuItem => {
            const demand = itemDemand[menuItem.name] || 0;
            // Include items with demand OR skip — we'll add low-stock items separately below
            if (!menuItem.ingredients || menuItem.ingredients.length === 0) return;

            menuItem.ingredients.forEach(ing => {
                if (!ing.ingredientId) return;

                const ingredientId = ing.ingredientId._id
                    ? ing.ingredientId._id.toString()
                    : ing.ingredientId.toString();

                const ingredient = ing.ingredientId._id
                    ? ing.ingredientId
                    : inventoryMap[ingredientId];

                if (!ingredient) return;

                const requiredQty = demand > 0 ? demand * ing.quantityRequired : 0;

                if (!ingredientRequirements[ingredientId]) {
                    ingredientRequirements[ingredientId] = {
                        ingredientName: ingredient.name,
                        unit: ingredient.unit,
                        currentStock: ingredient.quantity,
                        threshold: ingredient.threshold,
                        requiredStock: 0,
                        menuItemsUsing: []
                    };
                }

                ingredientRequirements[ingredientId].requiredStock += requiredQty;
                if (!ingredientRequirements[ingredientId].menuItemsUsing.includes(menuItem.name)) {
                    ingredientRequirements[ingredientId].menuItemsUsing.push(menuItem.name);
                }
            });
        });

        // ── SECOND PASS: Add ALL inventory items that are below their threshold ──
        // These are low-stock items that must always appear in Restock Alerts
        // even if they have no demand forecast (e.g. new items or no recent orders)
        inventory.forEach(inv => {
            const invId = inv._id.toString();
            const belowThreshold = inv.quantity <= inv.threshold;

            if (belowThreshold && !ingredientRequirements[invId]) {
                // Not already added via forecast — add it directly from inventory
                ingredientRequirements[invId] = {
                    ingredientName: inv.name,
                    unit: inv.unit,
                    currentStock: inv.quantity,
                    threshold: inv.threshold,
                    requiredStock: inv.threshold * 2, // suggest restocking to 2× threshold
                    menuItemsUsing: []
                };
            }
        });

        // Build restock suggestions
        const restockSuggestions = Object.values(ingredientRequirements)
        .filter(req => {
            // Always include: below threshold, has deficit, or has required stock
            const belowThreshold = req.currentStock <= req.threshold;
            const hasDeficit = req.requiredStock > req.currentStock;
            const hasRequiredStock = req.requiredStock > 0;
            return belowThreshold || hasDeficit || hasRequiredStock;
        })
        .map(req => {
            const deficit = req.requiredStock - req.currentStock;
            const deficitPercent = req.requiredStock > 0
                ? Math.round((deficit / req.requiredStock) * 100)
                : 0;

            // Determine urgency
            let urgency = 'ok';

            // Critical: stock at or below threshold AND big deficit
            if (req.currentStock <= req.threshold && deficit > 0 && deficitPercent > 50) {
                urgency = 'critical';
            }
            // Critical: very low stock (below 20% of threshold)
            else if (req.threshold > 0 && req.currentStock < req.threshold * 0.2) {
                urgency = 'critical';
            }
            // Warning: below threshold OR has some deficit
            else if (req.currentStock <= req.threshold || (deficit > 0)) {
                urgency = 'warning';
            }

            return {
                ingredientName: req.ingredientName,
                unit: req.unit,
                currentStock: Math.round(req.currentStock * 10) / 10,
                requiredStock: Math.round(req.requiredStock * 10) / 10,
                deficit: Math.round(Math.max(0, deficit) * 10) / 10,
                deficitPercent: Math.max(0, deficitPercent),
                urgency,
                menuItemsUsing: req.menuItemsUsing,
                stockRatio: req.requiredStock > 0
                    ? Math.min(1, Math.round((req.currentStock / req.requiredStock) * 100) / 100)
                    : req.currentStock <= req.threshold ? 0.2 : 1
            };
        });

        // Sort: critical first, then warning, then ok
        const urgencyOrder = { critical: 0, warning: 1, ok: 2 };
        restockSuggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

        const summary = {
            critical: restockSuggestions.filter(s => s.urgency === 'critical').length,
            warning: restockSuggestions.filter(s => s.urgency === 'warning').length,
            ok: restockSuggestions.filter(s => s.urgency === 'ok').length,
            forecastDays: days
        };

        res.json({
            summary,
            suggestions: restockSuggestions
        });
    } catch (error) {
        console.error('Restock Suggestions Error:', error);
        res.status(500).json({ message: 'Failed to generate restock suggestions' });
    }
};

module.exports = { getHistoricalDemand, predictDemand, getRestockSuggestions };
