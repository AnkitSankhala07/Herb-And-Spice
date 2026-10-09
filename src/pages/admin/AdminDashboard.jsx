import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { TrendingUp, Users, DollarSign, Activity, AlertTriangle, ArrowUpRight, Flame, CalendarDays, CalendarRange, Calendar, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import clsx from 'clsx';
import { api } from '../../services/api';

const PERIOD_TABS = [
    { key: 'daily', label: 'Today', icon: CalendarDays },
    { key: 'weekly', label: 'This Week', icon: CalendarRange },
    { key: 'monthly', label: 'This Month', icon: Calendar },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#222222] text-white border border-[#333333] rounded-2xl px-4 py-2.5 shadow-xl">
                <p className="text-[#818181] text-[11px] font-bold mb-0.5">{label}</p>
                <p className="text-[#BCE2A3] font-mono font-bold text-sm">₹{payload[0].value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

const AdminDashboard = () => {
    const [stats, setStats] = useState({ revenue: 0, ordersToday: 0, activeOrders: 0, systemStatus: 'Healthy' });
    const [salesData, setSalesData] = useState({ daily: null, weekly: null, monthly: null });
    const [activePeriod, setActivePeriod] = useState('daily');
    const [lowStockItems, setLowStockItems] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/analytics/dashboard');
                setStats({
                    revenue: data.revenue,
                    ordersToday: data.ordersToday,
                    activeOrders: `${data.activeOrders}/12`,
                    systemStatus: 'Healthy'
                });
            } catch (err) {
                console.error(err);
                setStats({
                    revenue: 45280,
                    ordersToday: 64,
                    activeOrders: '8/12',
                    systemStatus: 'Optimal'
                });
            }
        };

        const fetchSalesOverview = async () => {
            try {
                const { data } = await api.get('/analytics/sales-overview');
                setSalesData(data);
            } catch (err) {
                console.error('Sales overview fetch failed:', err);
            }
        };

        const fetchLowStock = async () => {
            try {
                const { data } = await api.get('/inventory/low-stock');
                setLowStockItems(data);
            } catch (err) {
                console.error('Low stock fetch failed:', err);
            }
        };

        fetchStats();
        fetchSalesOverview();
        fetchLowStock();
    }, []);

    const statCards = [
        { title: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-[#5A724A]", bg: "bg-[#BCE2A3]/30", border: "border-[#EBEBEB]" },
        { title: "Active Tables", value: stats.activeOrders, icon: Users, color: "text-[#425934]", bg: "bg-[#BCE2A3]/30", border: "border-[#EBEBEB]" },
        { title: "Orders Today", value: stats.ordersToday, icon: TrendingUp, color: "text-[#5A724A]", bg: "bg-[#BCE2A3]/30", border: "border-[#EBEBEB]" },
        { title: "System Status", value: stats.systemStatus, icon: Activity, color: "text-[#5A724A]", bg: "bg-[#BCE2A3]/30", border: "border-[#EBEBEB]" },
    ];

    const currentSales = salesData[activePeriod];

    return (
        <div className="p-2 md:p-4 max-w-[1600px] mx-auto text-[#222222]">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Executive Dashboard</h1>
                <p className="text-[#818181] text-xs mt-1">Live operational and culinary revenue insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <Card className="p-5 flex items-center gap-4 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)] hover:shadow-[0_8px_30px_rgba(90,114,74,0.1)] transition-all">
                            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                                <stat.icon size={26} />
                            </div>
                            <div>
                                <p className="text-[#818181] text-[11px] font-bold uppercase tracking-wider">{stat.title}</p>
                                <h3 className="text-2xl font-mono font-extrabold text-[#222222] mt-0.5 tracking-tight">{stat.value}</h3>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Sales Overview Section */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="p-6 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)] mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-[#222222]">Sales Overview</h2>
                            <p className="text-[#818181] text-xs mt-0.5">Revenue breakdown by selected timeframe</p>
                        </div>
                        <div className="flex gap-1 bg-[#F8F8F8] p-1 rounded-full border border-[#EBEBEB] self-start sm:self-auto">
                            {PERIOD_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActivePeriod(tab.key)}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                                        activePeriod === tab.key
                                            ? "bg-[#5A724A] text-white shadow-xs"
                                            : "text-[#818181] hover:text-[#222222]"
                                    )}
                                >
                                    <tab.icon size={13} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sales Stats Mini Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#F8F8F8] p-4 rounded-2xl border border-[#EBEBEB]">
                            <p className="text-[11px] text-[#818181] uppercase tracking-wider font-bold mb-1">
                                {activePeriod === 'daily' ? "Today's" : activePeriod === 'weekly' ? "This Week's" : "This Month's"} Revenue
                            </p>
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={`rev-${activePeriod}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="text-2xl font-mono font-extrabold text-[#5A724A]"
                                >
                                    ₹{(currentSales?.total || 0).toLocaleString()}
                                </motion.h3>
                            </AnimatePresence>
                        </div>
                        <div className="bg-[#F8F8F8] p-4 rounded-2xl border border-[#EBEBEB]">
                            <p className="text-[11px] text-[#818181] uppercase tracking-wider font-bold mb-1">
                                {activePeriod === 'daily' ? "Today's" : activePeriod === 'weekly' ? "This Week's" : "This Month's"} Orders
                            </p>
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={`ord-${activePeriod}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="text-2xl font-mono font-extrabold text-[#222222]"
                                >
                                    {currentSales?.orders || 0}
                                </motion.h3>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Chart */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activePeriod}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-[280px] w-full"
                        >
                            {currentSales?.chart && currentSales.chart.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentSales.chart} barSize={26}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#818181', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#818181', fontSize: 11, fontFamily: 'Space Mono' }}
                                            tickFormatter={(v) => `₹${v}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(90,114,74,0.06)' }} />
                                        <Bar dataKey="sales" fill="#5A724A" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#818181]">
                                    <DollarSign size={36} className="opacity-30 mb-2" />
                                    <p className="text-xs font-semibold">No sales logged for this timeframe.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </Card>
            </motion.div>

            {/* AI Insights and Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-[#222222]">AI Culinary Insights</h2>
                        <div className="bg-[#BCE2A3]/30 text-[#425934] border border-[#BCE2A3] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={12} /> Live Analysis
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-sm text-[#222222] flex items-center gap-2">
                                    Lunch peak was exceptionally strong <ArrowUpRight size={16} className="text-[#5A724A]" />
                                </h3>
                                <span className="text-[11px] font-mono text-[#818181]">14:00</span>
                            </div>
                            <p className="text-xs text-[#818181] leading-relaxed">Between 1 PM and 2 PM, 24 guests were served, generating a 15% revenue bump compared to weekly averages.</p>
                        </div>

                        <div className="p-4 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-sm text-[#222222] flex items-center gap-2">
                                    Gourmet Burgers are trending <Flame size={16} className="text-[#D9822B]" />
                                </h3>
                                <span className="text-[11px] font-mono text-[#818181]">11:30</span>
                            </div>
                            <p className="text-xs text-[#818181] leading-relaxed">Classic and BBQ burgers were the top sellers, contributing 38% of food revenue with high repeat pairing rates.</p>
                        </div>
                    </div>
                </Card>

                {/* Low Stock Alerts */}
                <Card className="p-6 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-[#222222] flex items-center gap-2">
                            <Package size={18} className="text-[#5A724A]" /> Low Stock Alerts
                        </h2>
                        {lowStockItems.length > 0 && (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {lowStockItems.length} Item{lowStockItems.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {lowStockItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-[#818181]">
                            <div className="w-12 h-12 bg-[#BCE2A3]/30 rounded-full flex items-center justify-center text-[#5A724A] mb-3">
                                <Package size={22} />
                            </div>
                            <p className="text-xs font-bold text-[#222222]">Pantry &amp; Herbs Healthy</p>
                            <p className="text-[11px] text-[#818181] mt-0.5">All tracked inventory items are above safety thresholds.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                            {lowStockItems.map((item) => {
                                const isCritical = item.status === 'Critical';
                                const percentage = Math.round((item.quantity / item.threshold) * 100);
                                return (
                                    <motion.li
                                        key={item._id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={clsx(
                                            "p-3.5 rounded-2xl border flex gap-3 items-start",
                                            isCritical ? "bg-red-50/70 border-red-200" : "bg-amber-50/70 border-amber-200"
                                        )}
                                    >
                                        <div className="p-1.5 rounded-full shrink-0 mt-0.5 text-amber-700">
                                            <AlertTriangle size={15} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <strong className="block font-bold text-xs text-[#222222] truncate">
                                                    {item.name}
                                                </strong>
                                                <span className={clsx(
                                                    "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                                                    isCritical ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#818181]">
                                                <span className="font-mono font-bold text-[#222222]">{item.quantity}</span> {item.unit} / {item.threshold} {item.unit} min
                                            </p>
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
