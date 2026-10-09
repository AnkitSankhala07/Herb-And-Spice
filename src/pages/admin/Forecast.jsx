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

// Color palette matching Herb & Spice theme
const TREND_COLORS = { up: '#5A724A', stable: '#D9822B', down: '#D94A38' };
const URGENCY_CONFIG = {
    critical: { color: '#D94A38', bg: 'bg-red-50', border: 'border-red-200', badge: '🔴', label: 'Critical', icon: AlertTriangle },
    warning: { color: '#D9822B', bg: 'bg-amber-50', border: 'border-amber-200', badge: '🟠', label: 'Warning', icon: Flame },
    ok: { color: '#5A724A', bg: 'bg-[#BCE2A3]/30', border: 'border-[#BCE2A3]', badge: '🟢', label: 'Healthy', icon: CheckCircle },
};

// Custom Tooltip for Demand Chart
const DemandTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const trendIcon = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';
        const trendColor = TREND_COLORS[data.trend];
        return (
            <div className="bg-[#222222] text-white border border-[#333333] rounded-2xl px-4 py-3 shadow-2xl min-w-[200px]">
                <p className="font-bold text-sm mb-2">{data.itemName}</p>
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                        <span className="text-[#818181]">Predicted:</span>
                        <span className="text-[#BCE2A3] font-mono font-bold">{data.predictedQuantity} units</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#818181]">Avg:</span>
                        <span className="text-white font-mono">{data.avgQuantity}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#818181]">Confidence:</span>
                        <span className="text-white font-mono">{data.confidence}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[#818181]">Trend:</span>
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

// Heatmap Cell Component
const HeatmapCell = ({ value, maxVal }) => {
    const intensity = maxVal > 0 ? value / maxVal : 0;
    const opacity = Math.max(0.08, intensity);
    return (
        <div
            className="w-full h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all duration-200 hover:scale-105 cursor-default"
            style={{
                backgroundColor: `rgba(90, 114, 74, ${opacity})`,
                color: intensity > 0.4 ? '#ffffff' : '#222222',
                border: intensity > 0.6 ? '1px solid rgba(90, 114, 74, 0.4)' : '1px solid rgba(235, 235, 235, 0.8)'
            }}
            title={`${value} units`}
        >
            {value > 0 ? value : '—'}
        </div>
    );
};

// Progress Bar for Stock Ratio
const StockProgressBar = ({ ratio, urgency }) => {
    const config = URGENCY_CONFIG[urgency];
    const percent = Math.min(100, Math.round(ratio * 100));
    return (
        <div className="w-full bg-[#EBEBEB] rounded-full h-2 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
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
            // Fallback mock data
            setDemandData({
                targetDate: selectedDate,
                dayOfWeek: 'Friday',
                totalPredictedItems: 6,
                predictions: [
                    { itemName: 'Gourmet Cheeseburger', predictedQuantity: 32, avgQuantity: 25, confidence: 85, trend: 'up', trendPercent: 28 },
                    { itemName: 'Artisan Pizza', predictedQuantity: 28, avgQuantity: 26, confidence: 90, trend: 'stable', trendPercent: 5 },
                    { itemName: 'Paneer Crunch Burger', predictedQuantity: 18, avgQuantity: 20, confidence: 75, trend: 'down', trendPercent: -12 },
                    { itemName: 'Hickory BBQ Wings', predictedQuantity: 22, avgQuantity: 19, confidence: 80, trend: 'up', trendPercent: 15 },
                    { itemName: 'Botanical Herb Soda', predictedQuantity: 35, avgQuantity: 30, confidence: 70, trend: 'up', trendPercent: 20 },
                    { itemName: 'Truffle Fries', predictedQuantity: 15, avgQuantity: 16, confidence: 65, trend: 'stable', trendPercent: -3 },
                ]
            });
            setRestockData({
                summary: { critical: 2, warning: 3, ok: 4, forecastDays: 3 },
                suggestions: [
                    { ingredientName: 'Artisan Mozzarella', unit: 'kg', currentStock: 3, requiredStock: 15, deficit: 12, deficitPercent: 80, urgency: 'critical', menuItemsUsing: ['Artisan Pizza', 'Gourmet Cheeseburger'], stockRatio: 0.2 },
                    { ingredientName: 'Fresh Basil & Thyme', unit: 'bunch', currentStock: 5, requiredStock: 20, deficit: 15, deficitPercent: 75, urgency: 'critical', menuItemsUsing: ['Botanical Herb Soda'], stockRatio: 0.25 },
                    { ingredientName: 'Romaine Lettuce', unit: 'kg', currentStock: 5, requiredStock: 10, deficit: 5, deficitPercent: 50, urgency: 'warning', menuItemsUsing: ['Gourmet Cheeseburger'], stockRatio: 0.5 },
                    { ingredientName: 'Brioche Buns', unit: 'pcs', currentStock: 20, requiredStock: 30, deficit: 10, deficitPercent: 33, urgency: 'warning', menuItemsUsing: ['Gourmet Cheeseburger'], stockRatio: 0.67 },
                    { ingredientName: 'San Marzano Sauce', unit: 'L', currentStock: 6, requiredStock: 9, deficit: 3, deficitPercent: 33, urgency: 'warning', menuItemsUsing: ['Artisan Pizza'], stockRatio: 0.67 },
                    { ingredientName: 'Chicken Breast', unit: 'kg', currentStock: 30, requiredStock: 28, deficit: 0, deficitPercent: 0, urgency: 'ok', menuItemsUsing: ['Hickory BBQ Wings'], stockRatio: 1 },
                    { ingredientName: 'Paneer Blocks', unit: 'kg', currentStock: 15, requiredStock: 12, deficit: 0, deficitPercent: 0, urgency: 'ok', menuItemsUsing: ['Paneer Crunch Burger'], stockRatio: 1 },
                ]
            });
            setHistoricalData({
                heatmap: [
                    { itemName: 'Gourmet Cheeseburger', Sun: 15, Mon: 18, Tue: 20, Wed: 22, Thu: 25, Fri: 30, Sat: 35 },
                    { itemName: 'Artisan Pizza', Sun: 20, Mon: 22, Tue: 18, Wed: 25, Thu: 28, Fri: 26, Sat: 30 },
                    { itemName: 'Paneer Crunch Burger', Sun: 10, Mon: 12, Tue: 15, Wed: 14, Thu: 18, Fri: 20, Sat: 16 },
                    { itemName: 'Hickory BBQ Wings', Sun: 12, Mon: 15, Tue: 14, Wed: 18, Thu: 20, Fri: 22, Sat: 25 },
                    { itemName: 'Botanical Herb Soda', Sun: 25, Mon: 15, Tue: 18, Wed: 20, Thu: 28, Fri: 35, Sat: 40 },
                    { itemName: 'Truffle Fries', Sun: 8, Mon: 12, Tue: 14, Wed: 16, Thu: 15, Fri: 18, Sat: 20 },
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
                <div className="w-10 h-10 border-4 border-[#BCE2A3] border-t-[#5A724A] rounded-full animate-spin mb-4" />
                <p className="text-[#818181] text-xs uppercase tracking-wider font-semibold">Running Demand Engine...</p>
            </div>
        );
    }

    return (
        <div className="p-2 md:p-4 max-w-[1600px] mx-auto text-[#222222] space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-full bg-[#BCE2A3]/30 text-[#5A724A] flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">AI Demand Forecast</h1>
                    </div>
                    <p className="text-[#818181] text-xs">Predictive inventory supply and sales forecast.</p>
                </div>
                <button
                    onClick={() => fetchAllData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-[#F8F8F8] text-[#222222] border border-[#EBEBEB] rounded-full text-xs font-bold transition-all shadow-xs self-start disabled:opacity-50"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Analyzing...' : 'Refresh Prediction'}
                </button>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-[#BCE2A3]/30 rounded-lg text-[#5A724A]">
                            <Zap size={14} />
                        </div>
                        <span className="text-[10px] text-[#818181] uppercase tracking-wider font-bold">Predicted Dishes</span>
                    </div>
                    <h3 className="text-2xl font-mono font-extrabold text-[#5A724A]">
                        {demandData?.totalPredictedItems || 0}
                    </h3>
                </Card>

                <Card className="p-5 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
                            <AlertTriangle size={14} />
                        </div>
                        <span className="text-[10px] text-[#818181] uppercase tracking-wider font-bold">Critical Stock</span>
                    </div>
                    <h3 className="text-2xl font-mono font-extrabold text-red-600">
                        {restockData?.summary?.critical || 0}
                    </h3>
                </Card>

                <Card className="p-5 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                            <Flame size={14} />
                        </div>
                        <span className="text-[10px] text-[#818181] uppercase tracking-wider font-bold">Low Warnings</span>
                    </div>
                    <h3 className="text-2xl font-mono font-extrabold text-amber-600">
                        {restockData?.summary?.warning || 0}
                    </h3>
                </Card>

                <Card className="p-5 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-[#BCE2A3]/30 rounded-lg text-[#5A724A]">
                            <CheckCircle size={14} />
                        </div>
                        <span className="text-[10px] text-[#818181] uppercase tracking-wider font-bold">Stock Healthy</span>
                    </div>
                    <h3 className="text-2xl font-mono font-extrabold text-[#5A724A]">
                        {restockData?.summary?.ok || 0}
                    </h3>
                </Card>
            </div>

            {/* Demand Forecast Chart */}
            <Card className="p-6 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#BCE2A3]/30 text-[#5A724A] rounded-xl">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#222222]">Next Day Item Forecast</h2>
                            <p className="text-[#818181] text-xs">
                                {demandData?.dayOfWeek} • {demandData?.totalPredictedItems} item predictions
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-[#818181] font-semibold">Target date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-[#F8F8F8] border border-[#EBEBEB] rounded-full px-3.5 py-1 text-[#222222] text-xs font-mono outline-none focus:border-[#5A724A]"
                        />
                    </div>
                </div>

                {/* Trend Legend */}
                <div className="flex gap-4 mb-6 text-xs text-[#818181]">
                    {[{ label: 'Trending Up', color: TREND_COLORS.up, icon: TrendingUp },
                      { label: 'Stable', color: TREND_COLORS.stable, icon: Minus },
                      { label: 'Trending Down', color: TREND_COLORS.down, icon: TrendingDown }
                    ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5 font-medium">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                            <span>{l.label}</span>
                        </div>
                    ))}
                </div>

                <div className="h-[320px] w-full">
                    {demandData?.predictions?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demandData.predictions} margin={{ top: 5, right: 10, left: 0, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
                                <XAxis
                                    dataKey="itemName"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#818181', fontSize: 11 }}
                                    interval={0}
                                    angle={-15}
                                    textAnchor="end"
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#818181', fontSize: 11, fontFamily: 'Space Mono' }} />
                                <Tooltip content={<DemandTooltip />} />
                                <Bar dataKey="predictedQuantity" radius={[8, 8, 0, 0]} barSize={34}>
                                    {demandData.predictions.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={TREND_COLORS[entry.trend] || '#5A724A'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-[#818181] text-xs">
                            No predictions available.
                        </div>
                    )}
                </div>
            </Card>

            {/* Restock Alerts & Weekly Heatmap */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
                {/* Restock Recommendations */}
                <Card className="p-6 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)] h-full">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                                <PackageCheck size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-[#222222]">Restock Recommendations</h2>
                                <p className="text-[#818181] text-xs">Safety thresholds for upcoming 3 days</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {restockData?.suggestions?.length > 0 ? (
                            restockData.suggestions.map((item) => {
                                const config = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.ok;
                                const UrgencyIcon = config.icon;
                                return (
                                    <div
                                        key={item.ingredientName}
                                        className={`p-3.5 rounded-2xl border ${config.border} ${config.bg} transition-all`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <UrgencyIcon size={14} style={{ color: config.color }} />
                                                <span className="font-bold text-xs text-[#222222]">{item.ingredientName}</span>
                                                <span className="text-[#818181] text-[11px]">({item.unit})</span>
                                            </div>
                                            <span
                                                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                style={{ color: config.color, backgroundColor: 'white' }}
                                            >
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                                            <div>
                                                <span className="text-[#818181] text-[10px] block">Current</span>
                                                <span className="font-mono font-bold text-[#222222]">{item.currentStock}</span>
                                            </div>
                                            <div>
                                                <span className="text-[#818181] text-[10px] block">Required</span>
                                                <span className="font-mono font-bold text-[#222222]">{item.requiredStock}</span>
                                            </div>
                                            <div>
                                                <span className="text-[#818181] text-[10px] block">Deficit</span>
                                                <span className="font-mono font-bold" style={{ color: item.deficit > 0 ? config.color : '#5A724A' }}>
                                                    {item.deficit > 0 ? `-${item.deficit}` : '✓ OK'}
                                                </span>
                                            </div>
                                        </div>
                                        <StockProgressBar ratio={item.stockRatio} urgency={item.urgency} />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center text-[#818181] text-xs">
                                All ingredients healthy.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Heatmap */}
                <Card className="p-6 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)] h-full">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="p-2 bg-[#BCE2A3]/30 text-[#5A724A] rounded-xl">
                            <CalendarDays size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#222222]">Weekly Item Heatmap</h2>
                            <p className="text-[#818181] text-xs">Volume intensity by weekday</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[450px]">
                            <thead>
                                <tr>
                                    <th className="text-left text-[11px] text-[#818181] uppercase tracking-wider font-bold pb-2 pr-2">Dish</th>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <th key={day} className="text-center text-[10px] text-[#818181] uppercase font-bold pb-2 px-1">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {historicalData?.heatmap?.map((row) => (
                                    <tr key={row.itemName}>
                                        <td className="text-xs text-[#222222] font-semibold py-1 pr-2 truncate max-w-[120px]">
                                            {row.itemName}
                                        </td>
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <td key={day} className="px-0.5 py-1">
                                                <HeatmapCell value={row[day] || 0} maxVal={heatmapMax} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Forecast;
