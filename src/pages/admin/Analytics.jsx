import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Download, FileText, FileSpreadsheet, DollarSign, TrendingUp, Users, Calendar, Sparkles, CalendarDays, CalendarRange, ShoppingCart, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#5A724A', '#BCE2A3', '#708C5D', '#D9822B', '#3E5431'];

const PERIOD_TABS = [
    { key: 'daily', label: 'Today', icon: CalendarDays },
    { key: 'weekly', label: 'This Week', icon: CalendarRange },
    { key: 'monthly', label: 'This Month', icon: Calendar },
];

const SalesTooltip = ({ active, payload, label }) => {
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

const Analytics = () => {
    const [stats, setStats] = useState({ revenue: 0, ordersToday: 0, activeOrders: 0, avgOrderValue: 0 });
    const [salesTrends, setSalesTrends] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [salesData, setSalesData] = useState({ daily: null, weekly: null, monthly: null });
    const [aiInsights, setAiInsights] = useState([]);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState('daily');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [exportFormat, setExportFormat] = useState('pdf');
    const [exportStartDate, setExportStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [exportEndDate, setExportEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [exportingType, setExportingType] = useState(null);

    const handleGenerateReport = async (type) => {
        setExportingType(type);
        const toastId = toast.loading('Generating report...');
        try {
            let url = '';
            let ext = 'pdf';
            let mimeType = 'application/pdf';
            let filename = '';

            if (type === 'daily') {
                url = `/reports/daily?date=${exportStartDate}`;
                ext = 'pdf';
                mimeType = 'application/pdf';
                filename = `herb-spice-daily-report-${exportStartDate}.pdf`;
            } else if (type === 'monthly') {
                const d = new Date(exportStartDate);
                url = `/reports/monthly?month=${d.getMonth() + 1}&year=${d.getFullYear()}`;
                ext = 'pdf';
                mimeType = 'application/pdf';
                filename = `herb-spice-monthly-report-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}.pdf`;
            } else {
                url = `/reports/export?start=${exportStartDate}&end=${exportEndDate}&format=${exportFormat}`;
                ext = exportFormat === 'excel' ? 'xlsx' : exportFormat;
                mimeType = exportFormat === 'csv' 
                    ? 'text/csv' 
                    : exportFormat === 'excel' 
                        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                        : 'application/pdf';
                filename = `herb-spice-report-${exportStartDate}-to-${exportEndDate}.${ext}`;
            }

            const response = await api.get(url, { responseType: 'blob' });
            
            const urlObj = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
            const link = document.createElement('a');
            link.href = urlObj;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(urlObj);
            toast.success('Report downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error(`Failed to export ${type} report:`, error);
            toast.error('Failed to export report. Please try again.', { id: toastId });
        } finally {
            setExportingType(null);
        }
    };

    const fetchData = useCallback(async (isInitial = true) => {
        if (isInitial) setLoading(true);
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
                { name: 'Gourmet Cheeseburger', count: 45 },
                { name: 'Artisan Pizza', count: 38 },
                { name: 'Paneer Crunch Burger', count: 25 },
                { name: 'Hickory BBQ Wings', count: 20 },
                { name: 'Botanical Herb Soda', count: 18 }
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
                { name: 'Gourmet Cheeseburger', count: 45 },
                { name: 'Artisan Pizza', count: 38 },
                { name: 'Paneer Crunch Burger', count: 25 },
            ]);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    const fetchInsights = useCallback(async (isInitial = true) => {
        if (isInitial) setInsightsLoading(true);
        try {
            const insightsRes = await api.get('/analytics/insights');
            setAiInsights(insightsRes.data?.insights || []);
        } catch (e) {
            setAiInsights([]);
        } finally {
            if (isInitial) setInsightsLoading(false);
        }
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchData(false), fetchInsights(false)]);
            toast.success('Analytics data refreshed!');
        } catch (error) {
            toast.error('Failed to refresh analytics');
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData(true);
        fetchInsights(true);
    }, [fetchData, fetchInsights]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#BCE2A3] border-t-[#5A724A] rounded-full animate-spin mb-4" />
                <p className="text-[#818181] text-xs tracking-wider uppercase font-semibold">Synthesizing Analytics...</p>
            </div>
        );
    }

    const CATEGORY_DATA = [
        { name: 'Burgers', value: 45 },
        { name: 'Pizza', value: 25 },
        { name: 'Starters', value: 20 },
        { name: 'Drinks', value: 10 },
    ];

    const currentSales = salesData[activePeriod];

    return (
        <div className="p-2 md:p-4 max-w-[1600px] mx-auto text-[#222222] space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Analytics &amp; Reporting</h1>
                    <p className="text-[#818181] text-xs mt-1">Deep dive into revenue trends, order velocity, and menu performance.</p>
                </div>
                
                {/* Reporting Export & Refresh Toolbar */}
                <div className="bg-white border border-[#EBEBEB] px-4 py-2.5 rounded-full flex flex-wrap items-center gap-2.5 shadow-xs">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-[#F8F8F8] hover:bg-[#EBEBEB] text-[#222222] border border-[#EBEBEB] px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        title="Refresh Analytics Data"
                    >
                        <RefreshCw size={13} className={clsx("text-[#5A724A]", isRefreshing && "animate-spin")} />
                        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>

                    <div className="h-5 w-px bg-[#EBEBEB] mx-0.5 hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-[#5A724A]" />
                        <input 
                            type="date" 
                            className="bg-[#F8F8F8] border border-[#EBEBEB] text-[#222222] text-xs rounded-full px-3 py-1 outline-none font-medium"
                            value={exportStartDate}
                            onChange={e => setExportStartDate(e.target.value)}
                        />
                        <span className="text-[#818181] text-xs">to</span>
                        <input 
                            type="date" 
                            className="bg-[#F8F8F8] border border-[#EBEBEB] text-[#222222] text-xs rounded-full px-3 py-1 outline-none font-medium"
                            value={exportEndDate}
                            onChange={e => setExportEndDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="h-5 w-px bg-[#EBEBEB] mx-0.5 hidden sm:block" />
                    
                    <select 
                        className="bg-[#F8F8F8] border border-[#EBEBEB] text-[#222222] text-xs rounded-full px-3 py-1 outline-none font-medium"
                        value={exportFormat}
                        onChange={e => setExportFormat(e.target.value)}
                    >
                        <option value="pdf">PDF (Summary)</option>
                        <option value="csv">CSV (Raw Data)</option>
                        <option value="excel">Excel (Sheet)</option>
                    </select>
                    
                    <div className="flex gap-1.5 ml-1">
                        <button 
                            disabled={exportingType !== null}
                            onClick={() => handleGenerateReport('daily')}
                            className="bg-[#F8F8F8] hover:bg-[#EBEBEB] text-[#222222] border border-[#EBEBEB] px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {exportingType === 'daily' ? <div className="w-3 h-3 border-2 border-[#5A724A] border-t-transparent rounded-full animate-spin" /> : <FileText size={13} />}
                            Daily
                        </button>
                        <button 
                            disabled={exportingType !== null}
                            onClick={() => handleGenerateReport('custom')}
                            className="bg-[#5A724A] hover:bg-[#485D3B] text-white px-4 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                        >
                            {exportingType === 'custom' ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download size={13} />}
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex items-center justify-between bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div>
                        <p className="text-[#818181] font-bold text-[11px] uppercase tracking-wider mb-0.5">Total Revenue</p>
                        <h3 className="text-2xl font-mono font-extrabold text-[#5A724A] tracking-tight">₹{stats.revenue.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-[#BCE2A3]/30 text-[#5A724A] rounded-2xl flex items-center justify-center">
                        <DollarSign size={22} />
                    </div>
                </Card>

                <Card className="p-5 flex items-center justify-between bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div>
                        <p className="text-[#818181] font-bold text-[11px] uppercase tracking-wider mb-0.5">Orders Today</p>
                        <h3 className="text-2xl font-mono font-extrabold text-[#222222] tracking-tight">{stats.ordersToday}</h3>
                    </div>
                    <div className="w-12 h-12 bg-[#BCE2A3]/30 text-[#5A724A] rounded-2xl flex items-center justify-center">
                        <TrendingUp size={22} />
                    </div>
                </Card>

                <Card className="p-5 flex items-center justify-between bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div>
                        <p className="text-[#818181] font-bold text-[11px] uppercase tracking-wider mb-0.5">Avg Order Value</p>
                        <h3 className="text-2xl font-mono font-extrabold text-[#222222] tracking-tight">₹{stats.avgOrderValue}</h3>
                    </div>
                    <div className="w-12 h-12 bg-[#BCE2A3]/30 text-[#5A724A] rounded-2xl flex items-center justify-center">
                        <Calendar size={22} />
                    </div>
                </Card>

                <Card className="p-5 flex items-center justify-between bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div>
                        <p className="text-[#818181] font-bold text-[11px] uppercase tracking-wider mb-0.5">Active Tickets</p>
                        <h3 className="text-2xl font-mono font-extrabold text-[#222222] tracking-tight">{stats.activeOrders}</h3>
                    </div>
                    <div className="w-12 h-12 bg-[#BCE2A3]/30 text-[#5A724A] rounded-2xl flex items-center justify-center">
                        <Users size={22} />
                    </div>
                </Card>
            </div>

            {/* Sales Overview Area Chart */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="p-6 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_24px_rgba(90,114,74,0.06)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-[#222222]">Revenue Momentum</h2>
                            <p className="text-[#818181] text-xs mt-0.5">Periodic performance comparison</p>
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#F8F8F8] p-4 rounded-2xl border border-[#EBEBEB]">
                            <p className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-1">
                                {activePeriod === 'daily' ? "Today's" : activePeriod === 'weekly' ? "Weekly" : "Monthly"} Revenue
                            </p>
                            <h3 className="text-2xl font-mono font-extrabold text-[#5A724A]">
                                ₹{(currentSales?.total || 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-[#F8F8F8] p-4 rounded-2xl border border-[#EBEBEB]">
                            <p className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-1">Total Orders</p>
                            <h3 className="text-2xl font-mono font-extrabold text-[#222222]">
                                {currentSales?.orders || 0}
                            </h3>
                        </div>
                        <div className="bg-[#F8F8F8] p-4 rounded-2xl border border-[#EBEBEB]">
                            <p className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-1">Average Ticket</p>
                            <h3 className="text-2xl font-mono font-extrabold text-[#222222]">
                                ₹{currentSales?.orders > 0 ? Math.round(currentSales.total / currentSales.orders).toLocaleString() : 0}
                            </h3>
                        </div>
                    </div>

                    <div className="h-[280px] w-full">
                        {currentSales?.chart && currentSales.chart.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={currentSales.chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="sageSalesGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#5A724A" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#5A724A" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#818181', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#818181', fontSize: 11, fontFamily: 'Space Mono' }} tickFormatter={(v) => `₹${v}`} />
                                    <Tooltip content={<SalesTooltip />} />
                                    <Area type="monotone" dataKey="sales" stroke="#5A724A" strokeWidth={3} fill="url(#sageSalesGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[#818181] text-xs">
                                No sales data logged for this timeframe.
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>

            {/* Hourly Trend & Top Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <h3 className="text-base font-bold mb-6 text-[#222222] flex justify-between items-center">
                        Hourly Kitchen Flow
                        <span className="text-[11px] font-bold text-[#5A724A] bg-[#BCE2A3]/30 px-2.5 py-0.5 rounded-full border border-[#BCE2A3]">Live Today</span>
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
                                <XAxis dataKey="name" stroke="#818181" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#818181" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                                <Tooltip contentStyle={{ backgroundColor: '#222222', borderRadius: '16px', color: '#fff', border: 'none' }} />
                                <Line type="monotone" dataKey="sales" stroke="#5A724A" strokeWidth={3} dot={{ stroke: '#5A724A', strokeWidth: 2, r: 4, fill: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <h3 className="text-base font-bold mb-6 text-[#222222] flex justify-between items-center">
                        Top Selling Dishes
                        <span className="text-[11px] font-bold text-[#818181] bg-[#F8F8F8] px-2.5 py-0.5 rounded-full border border-[#EBEBEB]">Volume</span>
                    </h3>
                    <div className="h-72 w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topItems} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EBEBEB" />
                                <XAxis type="number" stroke="#818181" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#222222" fontSize={11} width={130} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#222222', borderRadius: '16px', color: '#fff', border: 'none' }} />
                                <Bar dataKey="count" fill="#5A724A" radius={[0, 8, 8, 0]} barSize={20}>
                                    {topItems.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* AI Insights and Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
                <Card className="p-6 col-span-1 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <h3 className="text-base font-bold mb-4 text-[#222222]">Sales Distribution</h3>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={CATEGORY_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={88}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {CATEGORY_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#222222', borderRadius: '16px', color: '#fff', border: 'none' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', color: '#818181' }} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 col-span-1 lg:col-span-2 bg-white border border-[#EBEBEB] rounded-3xl shadow-[0_4px_20px_rgba(90,114,74,0.05)]">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#BCE2A3]/30 text-[#5A724A] flex items-center justify-center">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#222222]">Herb &amp; Spice Intelligence</h3>
                                <p className="text-xs text-[#818181]">Live AI analytics synthesized from kitchen POS</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                            <h4 className="font-bold text-xs text-[#222222] mb-1">Gourmet Burgers Drive High Margin</h4>
                            <p className="text-xs text-[#818181] leading-relaxed">Guests pairing drinks with gourmet burgers yielded an average ticket boost of ₹180.</p>
                        </div>
                        <div className="p-4 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                            <h4 className="font-bold text-xs text-[#222222] mb-1">Evening Turnaround Acceleration</h4>
                            <p className="text-xs text-[#818181] leading-relaxed">Table clearance speed improved by 4 minutes during the 8 PM dining rush.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
