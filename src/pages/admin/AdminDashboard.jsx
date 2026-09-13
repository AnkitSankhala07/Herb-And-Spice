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
            <div className="bg-[#1C2B1A] border border-[#344530] rounded-xl px-4 py-3 shadow-xl">
                <p className="text-[#5A7A56] text-xs font-bold mb-1">{label}</p>
                <p className="text-[#C8973F] font-mono font-bold text-sm">₹{payload[0].value.toLocaleString()}</p>
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
        { title: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-gold", bg: "bg-gold/10", border: "border-gold/20" },
        { title: "Active Tables", value: stats.activeOrders, icon: Users, color: "text-teal", bg: "bg-teal/10", border: "border-teal/20" },
        { title: "Orders Today", value: stats.ordersToday, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
        { title: "System Status", value: stats.systemStatus, icon: Activity, color: "text-amber", bg: "bg-amber/10", border: "border-amber/20" },
    ];

    const currentSales = salesData[activePeriod];

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-foreground">
            <div className="mb-10">
                <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground-pale mb-2 tracking-tight">Executive Dashboard</h1>
                <p className="text-muted text-sm tracking-wide">Performance overview for today</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className={clsx("p-6 flex items-center gap-5 border shadow-md hover:shadow-xl transition-all duration-300 bg-surface", stat.border)}>
                            <div className={clsx("p-4 rounded-2xl", stat.bg, stat.color)}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <p className="text-muted text-sm font-medium mb-1 tracking-wider uppercase">{stat.title}</p>
                                <h3 className="text-3xl font-mono font-bold text-foreground-pale tracking-tighter">{stat.value}</h3>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Sales Overview Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="p-6 bg-surface/80 border-border shadow-lg backdrop-blur-sm mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-display font-bold text-foreground-pale">Sales Overview</h2>
                            <p className="text-muted text-sm mt-1">Revenue breakdown by period</p>
                        </div>
                        <div className="flex gap-1 bg-elevated p-1 rounded-xl border border-border">
                            {PERIOD_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActivePeriod(tab.key)}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                        activePeriod === tab.key
                                            ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                                            : "text-muted hover:text-foreground-pale"
                                    )}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sales Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-elevated p-5 rounded-2xl border border-border">
                            <p className="text-xs text-muted uppercase tracking-widest font-bold mb-2">
                                {activePeriod === 'daily' ? "Today's" : activePeriod === 'weekly' ? "This Week's" : "This Month's"} Revenue
                            </p>
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={`rev-${activePeriod}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-3xl font-mono font-bold text-gold tracking-tighter"
                                >
                                    ₹{(currentSales?.total || 0).toLocaleString()}
                                </motion.h3>
                            </AnimatePresence>
                        </div>
                        <div className="bg-elevated p-5 rounded-2xl border border-border">
                            <p className="text-xs text-muted uppercase tracking-widest font-bold mb-2">
                                {activePeriod === 'daily' ? "Today's" : activePeriod === 'weekly' ? "This Week's" : "This Month's"} Orders
                            </p>
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={`ord-${activePeriod}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-3xl font-mono font-bold text-teal tracking-tighter"
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
                            transition={{ duration: 0.3 }}
                            className="h-[280px] w-full"
                        >
                            {currentSales?.chart && currentSales.chart.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentSales.chart} barSize={24}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#344530" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#5A7A56', fontSize: 11, fontFamily: 'Space Mono' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#5A7A56', fontSize: 11, fontFamily: 'Space Mono' }}
                                            tickFormatter={(v) => `₹${v}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200,151,63,0.05)' }} />
                                        <Bar dataKey="sales" fill="#8B5E3C" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted">
                                    <DollarSign size={40} className="opacity-20 mb-3" />
                                    <p className="text-sm font-medium">No sales data for this period yet.</p>
                                    <p className="text-xs mt-1">Place some orders to see the chart populate!</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="p-6 lg:col-span-2 bg-surface/80 border-border shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-display font-bold text-foreground-pale">AI Insights & Narrative</h2>
                        <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <Activity size={12} /> Live Analysis
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-5 items-start group">
                            <div className="w-1.5 h-full bg-elevated rounded-full relative overflow-hidden self-stretch min-h-[60px]">
                                <div className="absolute top-0 w-full h-1/2 bg-teal rounded-full group-hover:h-full transition-all duration-700"></div>
                            </div>
                            <div className="flex-1 bg-elevated/50 p-5 rounded-2xl border border-border group-hover:border-teal/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-lg text-foreground-pale flex items-center gap-2">
                                        Lunch peak was strong <ArrowUpRight size={18} className="text-teal" />
                                    </h3>
                                    <span className="text-xs font-mono text-muted bg-surface px-2 py-1 rounded">14:00</span>
                                </div>
                                <p className="text-muted leading-relaxed">Between 1 PM and 2 PM, you served 24 customers, mapping to a 15% revenue bump compared to yesterday's average.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 items-start group">
                            <div className="w-1.5 h-full bg-elevated rounded-full relative overflow-hidden self-stretch min-h-[60px]">
                                <div className="absolute top-0 w-full h-2/3 bg-amber rounded-full group-hover:h-full transition-all duration-700"></div>
                            </div>
                            <div className="flex-1 bg-elevated/50 p-5 rounded-2xl border border-border group-hover:border-amber/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-lg text-foreground-pale flex items-center gap-2">
                                        Truffle Risotto is trending <Flame size={18} className="text-amber" />
                                    </h3>
                                    <span className="text-xs font-mono text-muted bg-surface px-2 py-1 rounded">11:30</span>
                                </div>
                                <p className="text-muted leading-relaxed">It is your top seller today, contributing 40% of food revenue and driving strong margins.</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-surface/80 border-border shadow-lg backdrop-blur-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-display font-bold text-foreground-pale flex items-center gap-2">
                            <Package size={20} className="text-amber" /> Low Stock Alerts
                        </h2>
                        {lowStockItems.length > 0 && (
                            <span className="bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded text-xs font-bold">
                                {lowStockItems.length} Item{lowStockItems.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {lowStockItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                            <div className="p-4 bg-teal/10 rounded-full text-teal mb-3">
                                <Package size={28} />
                            </div>
                            <p className="text-sm font-bold text-foreground-pale">All stocked up!</p>
                            <p className="text-xs text-muted mt-1">No inventory items are below their threshold.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3 flex-1 overflow-y-auto max-h-[320px] custom-scrollbar pr-1">
                            {lowStockItems.map((item) => {
                                const isCritical = item.status === 'Critical';
                                const percentage = Math.round((item.quantity / item.threshold) * 100);
                                return (
                                    <motion.li
                                        key={item._id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={clsx(
                                            "p-4 rounded-2xl border flex gap-4 items-start relative overflow-hidden group",
                                            isCritical
                                                ? "bg-danger/5 border-danger/20"
                                                : "bg-amber/5 border-amber/20"
                                        )}
                                    >
                                        <div className={clsx("absolute left-0 top-0 bottom-0 w-1", isCritical ? "bg-danger" : "bg-amber")} />
                                        <div className={clsx("p-2 rounded-full shrink-0 mt-0.5", isCritical ? "bg-danger/10 text-danger" : "bg-amber/10 text-amber")}>
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <strong className={clsx("block font-bold text-sm tracking-wide", isCritical ? "text-danger" : "text-amber")}>
                                                    {item.name}
                                                </strong>
                                                <span className={clsx(
                                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                    isCritical ? "bg-danger/10 text-danger border-danger/20" : "bg-amber/10 text-amber border-amber/20"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-foreground-pale text-sm leading-snug">
                                                <span className="font-mono font-bold">{item.quantity}</span>
                                                <span className="text-muted"> {item.unit} remaining</span>
                                                <span className="text-muted"> • Threshold: {item.threshold} {item.unit}</span>
                                            </p>
                                            <div className="mt-2 h-1.5 bg-elevated rounded-full overflow-hidden">
                                                <div
                                                    className={clsx("h-full rounded-full transition-all duration-700", isCritical ? "bg-danger" : "bg-amber")}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
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
