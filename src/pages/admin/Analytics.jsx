import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Download, FileText, FileSpreadsheet, DollarSign, TrendingUp, Users, Calendar, Sparkles, CalendarDays, CalendarRange, ShoppingCart } from 'lucide-react';
import { api } from '../../services/api';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#8B5E3C', '#3A8C72', '#C8973F', '#D97743', '#8f5c4a'];

const PERIOD_TABS = [
    { key: 'daily', label: 'Today', icon: CalendarDays },
    { key: 'weekly', label: 'This Week', icon: CalendarRange },
    { key: 'monthly', label: 'This Month', icon: Calendar },
];

const SalesTooltip = ({ active, payload, label }) => {
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

const Analytics = () => {
    const [stats, setStats] = useState({ revenue: 0, ordersToday: 0, activeOrders: 0, avgOrderValue: 0 });
    const [salesTrends, setSalesTrends] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [salesData, setSalesData] = useState({ daily: null, weekly: null, monthly: null });
    const [aiInsights, setAiInsights] = useState([]);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState('daily');
    const [loading, setLoading] = useState(true);

    const [exportFormat, setExportFormat] = useState('pdf');
    const [exportStartDate, setExportStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [exportEndDate, setExportEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [exportingType, setExportingType] = useState(null);

    const handleGenerateReport = async (type) => {
        setExportingType(type);
        try {
            let url = '';
            let ext = 'pdf';
            let mimeType = 'application/pdf';

            if (type === 'daily') {
                url = `/reports/daily?date=${exportStartDate}`;
            } else if (type === 'monthly') {
                const d = new Date(exportStartDate);
                url = `/reports/monthly?month=${d.getMonth() + 1}&year=${d.getFullYear()}`;
            } else {
                url = `/reports/export?start=${exportStartDate}&end=${exportEndDate}&format=${exportFormat}`;
                ext = exportFormat === 'excel' ? 'xlsx' : exportFormat;
                mimeType = exportFormat === 'csv' 
                    ? 'text/csv' 
                    : exportFormat === 'excel' 
                        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                        : 'application/pdf';
            }

            const response = await api.get(url, { responseType: 'blob' });
            
            // Handle content disposition fallback for filename
            const defaultFilename = `akxton-${type}-report.${ext}`;
            const urlObj = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
            const link = document.createElement('a');
            link.href = urlObj;
            link.setAttribute('download', defaultFilename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(urlObj);
        } catch (error) {
            console.error(`Failed to export ${type} report:`, error);
        } finally {
            setExportingType(null);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardRes, trendsRes, topItemsRes, salesOverviewRes] = await Promise.all([
                    api.get('/analytics/dashboard'),
                    api.get('/analytics/trends'),
                    api.get('/analytics/top-items'),
                    api.get('/analytics/sales-overview')
                ]);

                setStats({
                    ...dashboardRes.data,
                    avgOrderValue: dashboardRes.data.avgOrderValue || 850
                });

                setSalesTrends(trendsRes.data?.length ? trendsRes.data : [
                    { name: '10 AM', sales: 400 }, { name: '12 PM', sales: 3000 },
                    { name: '2 PM', sales: 4500 }, { name: '4 PM', sales: 1500 },
                    { name: '6 PM', sales: 3200 }, { name: '8 PM', sales: 5000 },
                    { name: '10 PM', sales: 4200 }
                ]);

                setTopItems(topItemsRes.data?.length ? topItemsRes.data : [
                    { name: 'Truffle Risotto', count: 45 },
                    { name: 'Classic Burger', count: 38 },
                    { name: 'Caesar Salad', count: 25 },
                    { name: 'Margherita Pizza', count: 20 },
                    { name: 'Craft Beer', count: 18 }
                ]);

                setSalesData(salesOverviewRes.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                setStats({ revenue: 45280, ordersToday: 64, activeOrders: 8, avgOrderValue: 705 });
                setSalesTrends([
                    { name: '10 AM', sales: 400 }, { name: '12 PM', sales: 3000 },
                    { name: '2 PM', sales: 4500 }, { name: '4 PM', sales: 1500 },
                    { name: '6 PM', sales: 3200 }, { name: '8 PM', sales: 5000 },
                    { name: '10 PM', sales: 4200 }
                ]);
                setTopItems([
                    { name: 'Truffle Risotto', count: 45 },
                    { name: 'Classic Burger', count: 38 },
                    { name: 'Caesar Salad', count: 25 },
                    { name: 'Margherita Pizza', count: 20 },
                ]);
            } finally {
                setLoading(false);
            }
        };

        // Fetch AI insights separately so main charts don't wait on it
        const fetchInsights = async () => {
            setInsightsLoading(true);
            try {
                const insightsRes = await api.get('/analytics/insights');
                setAiInsights(insightsRes.data?.insights || []);
            } catch (e) {
                console.error('Failed to fetch AI insights', e);
                setAiInsights([]);
            } finally {
                setInsightsLoading(false);
            }
        };

        fetchData();
        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
                <p className="text-muted tracking-wide animate-pulse">Initializing Analytics Engine...</p>
            </div>
        );
    }

    const CATEGORY_DATA = [
        { name: 'Mains', value: 45 },
        { name: 'Appetizers', value: 25 },
        { name: 'Drinks', value: 20 },
        { name: 'Desserts', value: 10 },
    ];

    const currentSales = salesData[activePeriod];

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-foreground space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground-pale mb-1 tracking-tight">Analytics & Reports</h1>
                    <p className="text-muted text-sm tracking-wide">Deep dive into performance metrics and sales trends.</p>
                </div>
                
                {/* Advanced Reporting Export Toolbar */}
                <div className="bg-surface/80 border border-border px-4 py-3 rounded-2xl flex flex-wrap items-center gap-3 shadow-lg">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-primary" />
                        <input 
                            type="date" 
                            className="bg-elevated border border-border text-foreground text-xs rounded-lg px-2 py-1 outline-none"
                            value={exportStartDate}
                            onChange={e => setExportStartDate(e.target.value)}
                        />
                        <span className="text-muted text-xs mx-1">to</span>
                        <input 
                            type="date" 
                            className="bg-elevated border border-border text-foreground text-xs rounded-lg px-2 py-1 outline-none"
                            value={exportEndDate}
                            onChange={e => setExportEndDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="h-6 w-px bg-border mx-1"></div>
                    
                    <select 
                        className="bg-elevated border border-border text-foreground text-xs rounded-lg px-2 py-1.5 outline-none custom-scrollbar"
                        value={exportFormat}
                        onChange={e => setExportFormat(e.target.value)}
                    >
                        <option value="pdf">PDF (Summary)</option>
                        <option value="csv">CSV (Raw Data)</option>
                        <option value="excel">Excel (Sheet)</option>
                    </select>
                    
                    <div className="flex gap-2 ml-1">
                        <button 
                            disabled={exportingType !== null}
                            onClick={() => handleGenerateReport('daily')}
                            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {exportingType === 'daily' ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <FileText size={14} />}
                            Daily PDF
                        </button>
                        <button 
                            disabled={exportingType !== null}
                            onClick={() => handleGenerateReport('monthly')}
                            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {exportingType === 'monthly' ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <FileText size={14} />}
                            Monthly PDF
                        </button>
                        <button 
                            disabled={exportingType !== null}
                            onClick={() => handleGenerateReport('custom')}
                            className="bg-teal/20 hover:bg-teal/30 text-teal border border-teal/30 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                        >
                            {exportingType === 'custom' ? <div className="w-3 h-3 border-2 border-teal border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
                            Export Data
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 flex items-center justify-between border-primary/30 shadow-[0_8px_30px_rgba(139,94,60,0.15)] bg-gradient-to-br from-surface to-surface relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10">
                        <p className="text-muted font-medium text-sm uppercase tracking-wider mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-mono font-bold text-gold tracking-tighter">₹{stats.revenue.toLocaleString()}</h3>
                    </div>
                    <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl relative z-10 shadow-inner">
                        <DollarSign size={24} />
                    </div>
                </Card>

                <Card className="p-6 flex items-center justify-between bg-surface border-border shadow-md hover:shadow-lg transition-shadow">
                    <div>
                        <p className="text-muted font-medium text-sm uppercase tracking-wider mb-1">Orders Today</p>
                        <h3 className="text-3xl font-mono font-bold text-foreground-pale tracking-tighter">{stats.ordersToday}</h3>
                    </div>
                    <div className="p-4 bg-teal/10 text-teal border border-teal/20 rounded-2xl">
                        <TrendingUp size={24} />
                    </div>
                </Card>

                <Card className="p-6 flex items-center justify-between bg-surface border-border shadow-md hover:shadow-lg transition-shadow">
                    <div>
                        <p className="text-muted font-medium text-sm uppercase tracking-wider mb-1">Avg Order Value</p>
                        <h3 className="text-3xl font-mono font-bold text-foreground-pale tracking-tighter">₹{stats.avgOrderValue}</h3>
                    </div>
                    <div className="p-4 bg-amber/10 text-amber border border-amber/20 rounded-2xl">
                        <Calendar size={24} />
                    </div>
                </Card>

                <Card className="p-6 flex items-center justify-between bg-surface border-border shadow-md hover:shadow-lg transition-shadow">
                    <div>
                        <p className="text-muted font-medium text-sm uppercase tracking-wider mb-1">Active Orders</p>
                        <h3 className="text-3xl font-mono font-bold text-foreground-pale tracking-tighter">{stats.activeOrders}</h3>
                    </div>
                    <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
                        <Users size={24} />
                    </div>
                </Card>
            </div>

            {/* ========== SALES OVERVIEW SECTION ========== */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="p-6 bg-surface/80 border-border shadow-lg backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-display font-bold text-foreground-pale">Sales Overview</h2>
                            <p className="text-muted text-sm mt-1">Daily, weekly & monthly revenue breakdown</p>
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

                    {/* Revenue + Orders summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                                    className="text-3xl font-mono font-bold text-teal tracking-tighter flex items-center gap-2"
                                >
                                    <ShoppingCart size={20} className="text-teal/60" />
                                    {currentSales?.orders || 0}
                                </motion.h3>
                            </AnimatePresence>
                        </div>
                        <div className="bg-elevated p-5 rounded-2xl border border-border">
                            <p className="text-xs text-muted uppercase tracking-widest font-bold mb-2">Avg per Order</p>
                            <AnimatePresence mode="wait">
                                <motion.h3
                                    key={`avg-${activePeriod}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-3xl font-mono font-bold text-primary tracking-tighter"
                                >
                                    ₹{currentSales?.orders > 0 ? Math.round(currentSales.total / currentSales.orders).toLocaleString() : 0}
                                </motion.h3>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Area Chart */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activePeriod}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="h-[300px] w-full"
                        >
                            {currentSales?.chart && currentSales.chart.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={currentSales.chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#C8973F" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#C8973F" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3828" vertical={false} />
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
                                        <Tooltip content={<SalesTooltip />} cursor={{ stroke: '#C8973F', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#C8973F"
                                            strokeWidth={3}
                                            fill="url(#salesGradient)"
                                            dot={{ stroke: '#243023', strokeWidth: 3, r: 5, fill: '#C8973F' }}
                                            activeDot={{ r: 7, fill: '#8B5E3C', stroke: '#F0E8D5', strokeWidth: 2 }}
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <Card className="p-6 bg-surface border-border shadow-lg">
                    <h3 className="text-lg font-display font-bold mb-8 text-foreground-pale flex justify-between items-center">
                        Hourly Sales Trend
                        <span className="text-xs font-sans font-bold text-muted bg-elevated px-2 py-1 rounded border border-border">Today</span>
                    </h3>
                    <div className="h-80 w-full relative left-[-10px] md:left-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a3828" vertical={false} />
                                <XAxis dataKey="name" stroke="#8A9286" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#8A9286" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#243023', border: '1px solid #3a4738', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', color: '#F0E8D5' }}
                                    itemStyle={{ color: '#C8973F', fontWeight: 'bold' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#C8973F"
                                    strokeWidth={3}
                                    dot={{ stroke: '#243023', strokeWidth: 3, r: 6, fill: '#C8973F' }}
                                    activeDot={{ r: 8, fill: '#8B5E3C', stroke: '#F0E8D5', strokeWidth: 2 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Popular Items Chart */}
                <Card className="p-6 bg-surface border-border shadow-lg">
                    <h3 className="text-lg font-display font-bold mb-8 text-foreground-pale flex justify-between items-center">
                        Top Selling Items
                        <span className="text-xs font-sans font-bold text-muted bg-elevated px-2 py-1 rounded border border-border">Units Sold</span>
                    </h3>
                    <div className="h-80 w-full relative left-[-15px] md:left-0 text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topItems} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2a3828" />
                                <XAxis type="number" stroke="#8A9286" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#F0E8D5" fontSize={11} width={110} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#1C2B1A' }}
                                    contentStyle={{ backgroundColor: '#243023', border: '1px solid #3a4738', borderRadius: '12px', color: '#F0E8D5' }}
                                    itemStyle={{ color: '#3A8C72', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="count" fill="#3A8C72" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                                    {topItems.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                {/* Category Distribution */}
                <Card className="p-6 col-span-1 bg-surface border-border shadow-lg">
                    <h3 className="text-lg font-display font-bold mb-4 text-foreground-pale">Sales by Category</h3>
                    <div className="h-64 w-full relative left-[-10px] md:left-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                                <Pie
                                    data={CATEGORY_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {CATEGORY_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#243023', border: '1px solid #3a4738', borderRadius: '12px', color: '#F0E8D5' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#a0af9d', paddingTop: '20px' }} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* AI Insights & Assistant — Dynamic from real data */}
                <Card className="p-8 col-span-1 lg:col-span-2 border-primary/30 shadow-[0_8px_30px_rgba(139,94,60,0.1)] bg-gradient-to-r from-surface to-[#263124] relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-[radial-gradient(circle,rgba(200,151,63,0.1)_0%,transparent_70%)] pointer-events-none" />

                    <div className="flex flex-col w-full relative z-10">
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/20 text-gold rounded-xl shadow-inner border border-primary/30">
                                    <Sparkles size={22} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-bold text-foreground-pale">AKXTON Intelligence</h3>
                                    <p className="text-xs text-muted mt-0.5">Live insights from your real order data</p>
                                </div>
                            </div>
                            {!insightsLoading && (
                                <button
                                    onClick={async () => {
                                        setInsightsLoading(true);
                                        try {
                                            const r = await api.get('/analytics/insights');
                                            setAiInsights(r.data?.insights || []);
                                        } catch(e) { /* ignore */ }
                                        finally { setInsightsLoading(false); }
                                    }}
                                    className="text-xs text-muted hover:text-gold border border-border hover:border-gold/30 px-3 py-1.5 rounded-lg transition-all"
                                >↻ Refresh</button>
                            )}
                        </div>

                        {insightsLoading ? (
                            <div className="flex items-center gap-3 py-8">
                                <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                                <span className="text-muted text-sm animate-pulse">Analyzing live data...</span>
                            </div>
                        ) : aiInsights.length > 0 ? (
                            <ul className="space-y-3 w-full">
                                {aiInsights.map((insight, i) => {
                                    const dotColor = insight.severity === 'positive' ? 'text-teal'
                                        : insight.severity === 'negative' ? 'text-red-400'
                                        : 'text-amber';
                                    return (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            className="flex gap-4 p-4 bg-elevated/50 border border-border rounded-xl hover:border-primary/20 transition-colors"
                                        >
                                            <span className={`font-bold text-lg leading-none mt-0.5 ${dotColor}`}>•</span>
                                            <div>
                                                <span className="text-foreground-pale font-medium text-sm leading-relaxed">{insight.title}</span>
                                                <p className="text-xs text-muted/80 mt-1 leading-relaxed">{insight.detail}</p>
                                            </div>
                                        </motion.li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="py-8 text-center text-muted">
                                <Sparkles size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No insight data available yet.</p>
                                <p className="text-xs mt-1">Place some orders to start generating AI insights.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
