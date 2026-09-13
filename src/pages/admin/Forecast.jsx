import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Sparkles, BrainCircuit, CalendarDays, PackageCheck, TrendingUp, TrendingDown,
    Minus, AlertTriangle, CheckCircle, ShoppingCart, RefreshCw, Flame, Zap
} from 'lucide-react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// ── Color palette matching existing AKXTON theme ──
const TREND_COLORS = { up: '#3A8C72', stable: '#D4892A', down: '#C44B3A' };
const URGENCY_CONFIG = {
    critical: { color: '#C44B3A', bg: 'bg-red-500/10', border: 'border-red-500/30', badge: '🔴', label: 'Critical', icon: AlertTriangle },
    warning: { color: '#D4892A', bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: '🟠', label: 'Warning', icon: Flame },
    ok: { color: '#3A8C72', bg: 'bg-teal/10', border: 'border-teal/30', badge: '🟢', label: 'OK', icon: CheckCircle },
};

// ── Custom Tooltip for Demand Chart ──
const DemandTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const trendIcon = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';
        const trendColor = TREND_COLORS[data.trend];
        return (
            <div className="bg-[#1C2B1A] border border-[#344530] rounded-xl px-4 py-3 shadow-2xl min-w-[200px]">
                <p className="text-foreground font-bold text-sm mb-2">{data.itemName}</p>
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                        <span className="text-muted">Predicted:</span>
                        <span className="text-gold font-mono font-bold">{data.predictedQuantity} units</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted">Avg:</span>
                        <span className="text-foreground font-mono">{data.avgQuantity}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted">Confidence:</span>
                        <span className="text-foreground font-mono">{data.confidence}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted">Trend:</span>
                        <span className="font-mono font-bold" style={{ color: trendColor }}>
                            {data.trendPercent > 0 ? '+' : ''}{data.trendPercent}% {trendIcon}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// ── Heatmap Cell Component ──
const HeatmapCell = ({ value, maxVal }) => {
    const intensity = maxVal > 0 ? value / maxVal : 0;
    const opacity = Math.max(0.08, intensity);
    return (
        <div
            className="w-full h-10 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 hover:scale-110 cursor-default"
            style={{
                backgroundColor: `rgba(200, 151, 63, ${opacity})`,
                color: intensity > 0.4 ? '#1C2B1A' : intensity > 0 ? '#C8973F' : '#5A7A56',
                border: intensity > 0.6 ? '1px solid rgba(200, 151, 63, 0.4)' : '1px solid rgba(52, 69, 48, 0.5)'
            }}
            title={`${value} units`}
        >
            {value > 0 ? value : '—'}
        </div>
    );
};

// ── Progress Bar for Stock Ratio ──
const StockProgressBar = ({ ratio, urgency }) => {
    const config = URGENCY_CONFIG[urgency];
    const percent = Math.round(ratio * 100);
    return (
        <div className="w-full bg-elevated rounded-full h-2.5 overflow-hidden border border-border">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: config.color }}
            />
        </div>
    );
};

const Forecast = () => {
    const [demandData, setDemandData] = useState(null);
    const [restockData, setRestockData] = useState(null);
    const [historicalData, setHistoricalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const tomorrow = new Date(Date.now() + 86400000);
        return tomorrow.toISOString().split('T')[0];
    });

    const fetchAllData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const [demandRes, restockRes, historicalRes] = await Promise.all([
                api.get(`/forecast/demand?date=${selectedDate}`),
                api.get('/forecast/restock'),
                api.get('/forecast/historical')
            ]);
            setDemandData(demandRes.data);
            setRestockData(restockRes.data);
            setHistoricalData(historicalRes.data);
        } catch (error) {
            console.error('Forecast fetch error:', error);
            // Fallback mock data for demo
            setDemandData({
                targetDate: selectedDate,
                dayOfWeek: 'Friday',
                totalPredictedItems: 6,
                predictions: [
                    { itemName: 'Truffle Risotto', predictedQuantity: 32, avgQuantity: 25, confidence: 85, trend: 'up', trendPercent: 28, lastWeekSales: 40, prevWeekSales: 31 },
                    { itemName: 'Classic Burger', predictedQuantity: 28, avgQuantity: 26, confidence: 90, trend: 'stable', trendPercent: 5, lastWeekSales: 35, prevWeekSales: 33 },
                    { itemName: 'Caesar Salad', predictedQuantity: 18, avgQuantity: 20, confidence: 75, trend: 'down', trendPercent: -12, lastWeekSales: 15, prevWeekSales: 17 },
                    { itemName: 'Margherita Pizza', predictedQuantity: 22, avgQuantity: 19, confidence: 80, trend: 'up', trendPercent: 15, lastWeekSales: 25, prevWeekSales: 22 },
                    { itemName: 'Craft Beer', predictedQuantity: 35, avgQuantity: 30, confidence: 70, trend: 'up', trendPercent: 20, lastWeekSales: 42, prevWeekSales: 35 },
                    { itemName: 'Pasta Carbonara', predictedQuantity: 15, avgQuantity: 16, confidence: 65, trend: 'stable', trendPercent: -3, lastWeekSales: 18, prevWeekSales: 19 },
                ]
            });
            setRestockData({
                summary: { critical: 2, warning: 3, ok: 4, forecastDays: 3 },
                suggestions: [
                    { ingredientName: 'Cheese', unit: 'kg', currentStock: 3, requiredStock: 15, deficit: 12, deficitPercent: 80, urgency: 'critical', menuItemsUsing: ['Margherita Pizza', 'Classic Burger'], stockRatio: 0.2 },
                    { ingredientName: 'Truffle Oil', unit: 'ml', currentStock: 50, requiredStock: 200, deficit: 150, deficitPercent: 75, urgency: 'critical', menuItemsUsing: ['Truffle Risotto'], stockRatio: 0.25 },
                    { ingredientName: 'Lettuce', unit: 'kg', currentStock: 5, requiredStock: 10, deficit: 5, deficitPercent: 50, urgency: 'warning', menuItemsUsing: ['Caesar Salad'], stockRatio: 0.5 },
                    { ingredientName: 'Pasta', unit: 'kg', currentStock: 8, requiredStock: 12, deficit: 4, deficitPercent: 33, urgency: 'warning', menuItemsUsing: ['Pasta Carbonara', 'Truffle Risotto'], stockRatio: 0.67 },
                    { ingredientName: 'Tomato Sauce', unit: 'L', currentStock: 6, requiredStock: 9, deficit: 3, deficitPercent: 33, urgency: 'warning', menuItemsUsing: ['Margherita Pizza'], stockRatio: 0.67 },
                    { ingredientName: 'Beef Patty', unit: 'pcs', currentStock: 30, requiredStock: 28, deficit: 0, deficitPercent: 0, urgency: 'ok', menuItemsUsing: ['Classic Burger'], stockRatio: 1 },
                    { ingredientName: 'Beer Keg', unit: 'L', currentStock: 50, requiredStock: 35, deficit: 0, deficitPercent: 0, urgency: 'ok', menuItemsUsing: ['Craft Beer'], stockRatio: 1 },
                ]
            });
            setHistoricalData({
                heatmap: [
                    { itemName: 'Truffle Risotto', Sun: 15, Mon: 18, Tue: 20, Wed: 22, Thu: 25, Fri: 30, Sat: 35 },
                    { itemName: 'Classic Burger', Sun: 20, Mon: 22, Tue: 18, Wed: 25, Thu: 28, Fri: 26, Sat: 30 },
                    { itemName: 'Caesar Salad', Sun: 10, Mon: 12, Tue: 15, Wed: 14, Thu: 18, Fri: 20, Sat: 16 },
                    { itemName: 'Margherita Pizza', Sun: 12, Mon: 15, Tue: 14, Wed: 18, Thu: 20, Fri: 22, Sat: 25 },
                    { itemName: 'Craft Beer', Sun: 25, Mon: 15, Tue: 18, Wed: 20, Thu: 28, Fri: 35, Sat: 40 },
                    { itemName: 'Pasta Carbonara', Sun: 8, Mon: 12, Tue: 14, Wed: 16, Thu: 15, Fri: 18, Sat: 20 },
                ],
                totalItems: 42,
                periodDays: 30
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [selectedDate]);

    // Compute max value for heatmap
    const heatmapMax = useMemo(() => {
        if (!historicalData?.heatmap) return 1;
        let max = 0;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        historicalData.heatmap.forEach(row => {
            days.forEach(d => { if (row[d] > max) max = row[d]; });
        });
        return max || 1;
    }, [historicalData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[50vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                    <BrainCircuit size={24} className="absolute inset-0 m-auto text-gold animate-pulse" />
                </div>
                <p className="text-muted tracking-wide animate-pulse mt-6 text-sm">
                    AKXTON Intelligence is analyzing patterns...
                </p>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-foreground space-y-8"
        >
            {/* ── Header ── */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-gradient-to-br from-gold/20 to-primary/20 text-gold rounded-xl shadow-inner border border-gold/30">
                            <Sparkles size={22} className="animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
                                AI Forecast
                            </h1>
                            <p className="text-muted text-xs tracking-widest uppercase font-bold mt-0.5">
                                AKXTON Intelligence Engine
                            </p>
                        </div>
                    </div>
                    <p className="text-muted text-sm tracking-wide mt-1">
                        Predictive demand analysis & smart restocking recommendations.
                    </p>
                </div>
                <button
                    onClick={() => fetchAllData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,151,63,0.15)] disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Analyzing...' : 'Refresh'}
                </button>
            </motion.div>

            {/* ── Summary Cards ── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-gold/10 rounded-lg border border-gold/20">
                                <Zap size={16} className="text-gold" />
                            </div>
                            <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Predicted Items</span>
                        </div>
                        <h3 className="text-3xl font-mono font-bold text-gold tracking-tighter">
                            {demandData?.totalPredictedItems || 0}
                        </h3>
                    </div>
                </Card>

                <Card className="p-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                <AlertTriangle size={16} className="text-red-400" />
                            </div>
                            <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Critical Stock</span>
                        </div>
                        <h3 className="text-3xl font-mono font-bold text-red-400 tracking-tighter">
                            {restockData?.summary?.critical || 0}
                        </h3>
                    </div>
                </Card>

                <Card className="p-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-amber/10 rounded-lg border border-amber/20">
                                <Flame size={16} className="text-amber" />
                            </div>
                            <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Warnings</span>
                        </div>
                        <h3 className="text-3xl font-mono font-bold text-amber tracking-tighter">
                            {restockData?.summary?.warning || 0}
                        </h3>
                    </div>
                </Card>

                <Card className="p-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-teal/10 rounded-lg border border-teal/20">
                                <CheckCircle size={16} className="text-teal" />
                            </div>
                            <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Stock OK</span>
                        </div>
                        <h3 className="text-3xl font-mono font-bold text-teal tracking-tighter">
                            {restockData?.summary?.ok || 0}
                        </h3>
                    </div>
                </Card>
            </motion.div>

            {/* ── Demand Forecast Card ── */}
            <motion.div variants={itemVariants}>
                <Card className="p-6 bg-surface/80 border-border shadow-lg backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gold/10 text-gold rounded-xl border border-gold/20">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-foreground">Demand Forecast</h2>
                                <p className="text-muted text-xs mt-0.5">
                                    {demandData?.dayOfWeek} • {demandData?.totalPredictedItems} items predicted
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-xs text-muted uppercase tracking-wider font-bold">Forecast for:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-elevated border border-border rounded-xl px-4 py-2 text-foreground text-sm font-mono focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Trend Legend */}
                    <div className="flex gap-4 mb-6">
                        {[{ label: 'Trending Up', color: TREND_COLORS.up, icon: TrendingUp },
                          { label: 'Stable', color: TREND_COLORS.stable, icon: Minus },
                          { label: 'Trending Down', color: TREND_COLORS.down, icon: TrendingDown }
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
                                <l.icon size={12} style={{ color: l.color }} />
                                <span>{l.label}</span>
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedDate}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="h-[350px] w-full"
                        >
                            {demandData?.predictions?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={demandData.predictions}
                                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                                    >
                                        <defs>
                                            {Object.entries(TREND_COLORS).map(([key, color]) => (
                                                <linearGradient key={key} id={`bar-${key}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                                    <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3828" vertical={false} />
                                        <XAxis
                                            dataKey="itemName"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#5A7A56', fontSize: 11, fontFamily: 'Space Mono' }}
                                            interval={0}
                                            angle={-20}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#5A7A56', fontSize: 11, fontFamily: 'Space Mono' }}
                                        />
                                        <Tooltip content={<DemandTooltip />} cursor={{ fill: 'rgba(200,151,63,0.05)' }} />
                                        <Bar
                                            dataKey="predictedQuantity"
                                            radius={[8, 8, 0, 0]}
                                            barSize={40}
                                            animationDuration={1500}
                                        >
                                            {demandData.predictions.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={`url(#bar-${entry.trend})`}
                                                    style={{ filter: `opacity(${Math.max(0.5, entry.confidence / 100)})` }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted">
                                    <BrainCircuit size={48} className="opacity-20 mb-3" />
                                    <p className="text-sm font-medium">No prediction data available</p>
                                    <p className="text-xs mt-1">More order history is needed to generate forecasts.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </Card>
            </motion.div>

            {/* ── Restock Alerts + Weekly Heatmap Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Restock Alerts */}
                <motion.div variants={itemVariants}>
                    <Card className="p-6 bg-surface/80 border-border shadow-lg backdrop-blur-sm h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber/10 text-amber rounded-xl border border-amber/20">
                                    <PackageCheck size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-bold text-foreground">Restock Alerts</h2>
                                    <p className="text-muted text-xs mt-0.5">
                                        Next {restockData?.summary?.forecastDays || 3} days projection
                                    </p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 rounded-xl text-xs font-bold transition-all duration-300">
                                <ShoppingCart size={14} />
                                Order Supplies
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                            {restockData?.suggestions?.length > 0 ? (
                                restockData.suggestions.map((item, index) => {
                                    const config = URGENCY_CONFIG[item.urgency];
                                    const UrgencyIcon = config.icon;
                                    return (
                                        <motion.div
                                            key={item.ingredientName}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            className={`p-4 rounded-xl border ${config.border} ${config.bg} transition-all duration-300 hover:shadow-lg`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <UrgencyIcon size={16} style={{ color: config.color }} />
                                                    <span className="text-foreground font-bold text-sm">{item.ingredientName}</span>
                                                    <span className="text-muted text-xs">({item.unit})</span>
                                                </div>
                                                <span
                                                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border"
                                                    style={{ color: config.color, borderColor: config.color + '40', backgroundColor: config.color + '15' }}
                                                >
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                                                <div>
                                                    <span className="text-muted block mb-0.5">Current</span>
                                                    <span className="text-foreground font-mono font-bold">{item.currentStock}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted block mb-0.5">Required</span>
                                                    <span className="text-foreground font-mono font-bold">{item.requiredStock}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted block mb-0.5">Deficit</span>
                                                    <span className="font-mono font-bold" style={{ color: item.deficit > 0 ? config.color : '#3A8C72' }}>
                                                        {item.deficit > 0 ? `-${item.deficit}` : '✓ OK'}
                                                    </span>
                                                </div>
                                            </div>
                                            <StockProgressBar ratio={item.stockRatio} urgency={item.urgency} />
                                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                                                <span className="text-[10px] text-muted">Used in:</span>
                                                {item.menuItemsUsing?.map(m => (
                                                    <span key={m} className="text-[10px] bg-elevated px-2 py-0.5 rounded-md border border-border text-foreground">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-muted">
                                    <CheckCircle size={40} className="opacity-20 mb-3" />
                                    <p className="text-sm font-medium">All stock levels are healthy!</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>

                {/* Weekly Pattern Heatmap */}
                <motion.div variants={itemVariants}>
                    <Card className="p-6 bg-surface/80 border-border shadow-lg backdrop-blur-sm h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
                                <CalendarDays size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-foreground">Weekly Pattern</h2>
                                <p className="text-muted text-xs mt-0.5">
                                    Demand heatmap by item × day (last 30 days)
                                </p>
                            </div>
                        </div>

                        {/* Heatmap Legend */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Intensity:</span>
                            <div className="flex gap-1">
                                {[0.1, 0.25, 0.4, 0.6, 0.8, 1].map((v, i) => (
                                    <div
                                        key={i}
                                        className="w-5 h-3 rounded-sm"
                                        style={{ backgroundColor: `rgba(200, 151, 63, ${v})` }}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] text-muted ml-1">Low → High</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr>
                                        <th className="text-left text-xs text-muted uppercase tracking-wider font-bold pb-3 pr-3 min-w-[120px]">
                                            Item
                                        </th>
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <th key={day} className="text-center text-xs text-muted uppercase tracking-wider font-bold pb-3 px-1">
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {historicalData?.heatmap?.length > 0 ? (
                                        historicalData.heatmap.map((row, index) => (
                                            <motion.tr
                                                key={row.itemName}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group"
                                            >
                                                <td className="text-xs text-foreground font-medium py-1.5 pr-3 group-hover:text-gold transition-colors whitespace-nowrap">
                                                    {row.itemName}
                                                </td>
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                    <td key={day} className="px-1 py-1.5">
                                                        <HeatmapCell value={row[day] || 0} maxVal={heatmapMax} />
                                                    </td>
                                                ))}
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="text-center py-10 text-muted text-sm">
                                                No historical pattern data available yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Insight callout */}
                        {historicalData?.heatmap?.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-5 p-4 bg-gold/5 border border-gold/20 rounded-xl"
                            >
                                <div className="flex items-start gap-3">
                                    <Sparkles size={16} className="text-gold mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-foreground font-medium">
                                            <span className="text-gold font-bold">AI Insight:</span>{' '}
                                            {(() => {
                                                // Find the item + day with max demand
                                                let maxItem = '', maxDay = '', maxVal = 0;
                                                historicalData.heatmap.forEach(row => {
                                                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
                                                        if (row[d] > maxVal) {
                                                            maxVal = row[d];
                                                            maxItem = row.itemName;
                                                            maxDay = d === 'Sun' ? 'Sundays' : d === 'Mon' ? 'Mondays' : d === 'Tue' ? 'Tuesdays' : d === 'Wed' ? 'Wednesdays' : d === 'Thu' ? 'Thursdays' : d === 'Fri' ? 'Fridays' : 'Saturdays';
                                                        }
                                                    });
                                                });
                                                return `"${maxItem}" sells most on ${maxDay} (~${maxVal} units avg). Consider boosting prep capacity and ingredient stock accordingly.`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* ── Footer Branding ── */}
            <motion.div
                variants={itemVariants}
                className="flex items-center justify-center gap-2 py-6 text-muted text-xs"
            >
                <BrainCircuit size={14} className="text-gold/50" />
                <span className="tracking-widest uppercase">Powered by AKXTON Intelligence v2.0</span>
            </motion.div>
        </motion.div>
    );
};

export default Forecast;
