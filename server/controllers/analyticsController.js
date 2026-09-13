const Order = require('../models/Order');
// const moment = require('moment'); // Removed unused dependency

// @desc    Get Admin Analytics (Dashboard Stats)
// @route   GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 1. Total Revenue (All Time)
        const totalRevenueAgg = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = totalRevenueAgg[0]?.total || 0;

        // 2. Orders Today
        const ordersTodayCount = await Order.countDocuments({
            createdAt: { $gte: todayStart }
        });

        // 3. Active Orders (Pending/Preparing)
        const activeOrdersCount = await Order.countDocuments({
            status: { $in: ['Pending', 'Preparing', 'Ready'] }
        });

        // 4. Average Order Value
        const totalOrders = await Order.countDocuments({ status: { $ne: 'Cancelled' } });
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

        res.json({
            revenue: totalRevenue,
            ordersToday: ordersTodayCount,
            activeOrders: activeOrdersCount,
            avgOrderValue: avgOrderValue
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Sales Trends (Chart Data)
// @route   GET /api/analytics/trends
const getSalesTrends = async (req, res) => {
    try {
        // Hourly Sales for Today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const hourlySales = await Order.aggregate([
            { $match: { createdAt: { $gte: todayStart } } },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    sales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Format for Recharts (e.g., "10 AM")
        const formattedTrends = hourlySales.map(item => ({
            name: `${item._id}:00`,
            sales: item.sales
        }));

        res.json(formattedTrends);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Top Selling Items
// @route   GET /api/analytics/top-items
const getTopItems = async (req, res) => {
    try {
        const topItems = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    count: { $sum: "$items.quantity" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const formatted = topItems.map(i => ({ name: i._id, count: i.count }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Sales Overview (Daily / Weekly / Monthly)
// @route   GET /api/analytics/sales-overview
const getSalesOverview = async (req, res) => {
    try {
        const now = new Date();

        // Today
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        // This Week (Monday start)
        const weekStart = new Date(now);
        const dayOfWeek = weekStart.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
        weekStart.setDate(weekStart.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);

        // This Month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Daily sales (hourly breakdown for today)
        const dailySales = await Order.aggregate([
            { $match: { createdAt: { $gte: todayStart }, status: { $ne: 'Cancelled' } } },
            { $group: { _id: { $hour: "$createdAt" }, sales: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        const dailyTotal = dailySales.reduce((sum, h) => sum + h.sales, 0);
        const dailyOrders = dailySales.reduce((sum, h) => sum + h.orders, 0);
        const dailyChart = dailySales.map(h => ({ name: `${h._id}:00`, sales: h.sales }));

        // Weekly sales (daily breakdown for this week)
        const weeklySales = await Order.aggregate([
            { $match: { createdAt: { $gte: weekStart }, status: { $ne: 'Cancelled' } } },
            { $group: { _id: { $dayOfWeek: "$createdAt" }, sales: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        const weeklyTotal = weeklySales.reduce((sum, d) => sum + d.sales, 0);
        const weeklyOrders = weeklySales.reduce((sum, d) => sum + d.orders, 0);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyChart = weeklySales.map(d => ({ name: dayNames[d._id - 1], sales: d.sales }));

        // Monthly sales (daily breakdown for this month)
        const monthlySales = await Order.aggregate([
            { $match: { createdAt: { $gte: monthStart }, status: { $ne: 'Cancelled' } } },
            { $group: { _id: { $dayOfMonth: "$createdAt" }, sales: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        const monthlyTotal = monthlySales.reduce((sum, d) => sum + d.sales, 0);
        const monthlyOrders = monthlySales.reduce((sum, d) => sum + d.orders, 0);
        const monthlyChart = monthlySales.map(d => ({ name: `Day ${d._id}`, sales: d.sales }));

        res.json({
            daily:   { total: dailyTotal,   orders: dailyOrders,   chart: dailyChart },
            weekly:  { total: weeklyTotal,  orders: weeklyOrders,  chart: weeklyChart },
            monthly: { total: monthlyTotal, orders: monthlyOrders, chart: monthlyChart }
        });
    } catch (error) {
        console.error("Sales Overview Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get AI-Generated Insights (Dynamic, from real data)
// @route   GET /api/analytics/insights
const getAIInsights = async (req, res) => {
    try {
        const now = new Date();

        // Today & yesterday boundaries
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart); yesterdayEnd.setMilliseconds(-1);

        // Last week for trend comparison
        const lastWeekStart = new Date(todayStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const twoWeeksStart = new Date(todayStart); twoWeeksStart.setDate(twoWeeksStart.getDate() - 14);

        const [
            todayRevAgg, yesterdayRevAgg,
            thisWeekItems, lastWeekItems,
            activeOrders, todayOrders,
            hourlyToday
        ] = await Promise.all([
            // Today revenue
            Order.aggregate([
                { $match: { createdAt: { $gte: todayStart }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]),
            // Yesterday revenue
            Order.aggregate([
                { $match: { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            // This week top items
            Order.aggregate([
                { $match: { createdAt: { $gte: lastWeekStart }, status: { $ne: 'Cancelled' } } },
                { $unwind: '$items' },
                { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
                { $sort: { count: -1 } }, { $limit: 3 }
            ]),
            // Last week top items
            Order.aggregate([
                { $match: { createdAt: { $gte: twoWeeksStart, $lt: lastWeekStart }, status: { $ne: 'Cancelled' } } },
                { $unwind: '$items' },
                { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } }
            ]),
            // Active orders (kitchen load)
            Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } }),
            // Today order count
            Order.countDocuments({ createdAt: { $gte: todayStart } }),
            // Hourly breakdown today
            Order.aggregate([
                { $match: { createdAt: { $gte: todayStart }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: { $hour: '$createdAt' }, sales: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
                { $sort: { sales: -1 } }, { $limit: 1 }
            ])
        ]);

        const insights = [];

        // Insight 1: Revenue vs yesterday
        const todayRev = todayRevAgg[0]?.total || 0;
        const yesterdayRev = yesterdayRevAgg[0]?.total || 0;
        if (yesterdayRev > 0) {
            const pct = Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100);
            const direction = pct >= 0 ? 'up' : 'down';
            insights.push({
                type: 'revenue',
                severity: pct >= 10 ? 'positive' : pct < -10 ? 'negative' : 'neutral',
                title: `Revenue ${direction === 'up' ? '↑' : '↓'} ${Math.abs(pct)}% vs Yesterday`,
                detail: `Today: ₹${todayRev.toLocaleString()} vs Yesterday: ₹${yesterdayRev.toLocaleString()}. ${pct >= 0 ? 'Strong performance — keep kitchen running at capacity.' : 'Slower day than usual — consider running a promotion.'}`
            });
        } else if (todayRev > 0) {
            insights.push({
                type: 'revenue',
                severity: 'positive',
                title: `₹${todayRev.toLocaleString()} Revenue Today`,
                detail: `${todayOrders} orders completed so far. No comparison data yet — keep the momentum going!`
            });
        } else {
            insights.push({
                type: 'revenue',
                severity: 'neutral',
                title: 'No Orders Yet Today',
                detail: 'Revenue tracking starts when the first order is placed. Run seedExtended.js to populate demo data.'
            });
        }

        // Insight 2: Trending item
        if (thisWeekItems.length > 0) {
            const topItem = thisWeekItems[0];
            const lastWeekMap = {};
            lastWeekItems.forEach(i => { lastWeekMap[i._id] = i.count; });
            const prevCount = lastWeekMap[topItem._id] || 0;
            const trendPct = prevCount > 0 ? Math.round(((topItem.count - prevCount) / prevCount) * 100) : null;
            insights.push({
                type: 'trending',
                severity: 'positive',
                title: `"${topItem._id}" is this week's top seller`,
                detail: trendPct !== null
                    ? `Sold ${topItem.count} units this week (${trendPct >= 0 ? '+' : ''}${trendPct}% vs last week). Consider featuring it prominently on the menu.`
                    : `Sold ${topItem.count} units this week. No comparison data yet — this is your current top performer.`
            });
        }

        // Insight 3: Kitchen load
        const kitchenSeverity = activeOrders >= 8 ? 'negative' : activeOrders >= 4 ? 'neutral' : 'positive';
        const kitchenMsg = activeOrders >= 8
            ? `${activeOrders} active orders in queue — kitchen is under high load. Expeditor intervention may be needed.`
            : activeOrders >= 4
            ? `${activeOrders} orders currently active. Kitchen is operating at normal capacity.`
            : activeOrders > 0
            ? `Only ${activeOrders} active order(s). Kitchen capacity is available — good time for prep work.`
            : 'No active orders. Kitchen is idle.';
        insights.push({
            type: 'kitchen',
            severity: kitchenSeverity,
            title: `Kitchen Load: ${activeOrders >= 8 ? 'Elevated 🔴' : activeOrders >= 4 ? 'Moderate 🟡' : 'Low 🟢'}`,
            detail: kitchenMsg
        });

        // Insight 4: Peak hour
        if (hourlyToday.length > 0) {
            const peak = hourlyToday[0];
            const hour = peak._id;
            const period = hour < 12 ? 'AM' : 'PM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            insights.push({
                type: 'peak',
                severity: 'neutral',
                title: `Peak Hour Today: ${displayHour}:00 ${period}`,
                detail: `₹${peak.sales.toLocaleString()} revenue and ${peak.count} orders during this hour. Ensure adequate staffing during this window.`
            });
        }

        res.json({ insights, generatedAt: new Date().toISOString() });
    } catch (error) {
        console.error('AI Insights Error:', error);
        res.status(500).json({ message: 'Failed to generate insights' });
    }
};

module.exports = { getDashboardStats, getSalesTrends, getTopItems, getSalesOverview, getAIInsights };
