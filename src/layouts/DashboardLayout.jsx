import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart, LogOut, ShoppingCart, UtensilsCrossed, QrCode, BrainCircuit, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { OfflineBanner } from '../components/ui/OfflineBanner';

export default function DashboardLayout({ role = 'admin' }) {
    const location = useLocation();
    const [user, setUser] = useState(() => {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    });

    const links = role === 'admin' ? [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
        { name: 'Inventory', path: '/admin/inventory', icon: ClipboardList },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart },
        { name: 'AI Forecast', path: '/admin/forecast', icon: BrainCircuit },
        { name: 'Tables & QR', path: '/admin/tables', icon: QrCode },
    ] : role === 'waiter' ? [
        { name: 'Floor Plan', path: '/waiter/dashboard', icon: LayoutDashboard },
        { name: 'Active Orders', path: '/waiter/orders', icon: ShoppingCart },
    ] : [
        { name: 'Kitchen Display', path: '/kitchen/dashboard', icon: LayoutDashboard },
    ];

    return (
        <div className="flex min-h-screen bg-[#F4F6F0] text-[#222222] font-body pb-24 md:pb-0">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 border-r border-[#EBEBEB] bg-white p-6 hidden md:flex flex-col fixed inset-y-0 z-40 shadow-xs">
                {/* Brand Header */}
                <div className="mb-8 pl-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 rounded-full bg-[#5A724A] flex items-center justify-center text-white text-sm shadow-xs">
                            🌿
                        </div>
                        <h2 className="text-xl font-extrabold text-[#222222] tracking-tight">
                            Herb &amp; Spice
                        </h2>
                    </div>
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-[#5A724A] bg-[#BCE2A3]/30 border border-[#BCE2A3] px-2.5 py-0.5 rounded-full ml-1">
                        {role} Workspace
                    </span>
                </div>

                {/* User Profile Section */}
                {user && (
                    <div className="mb-6 p-3.5 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#5A724A]/15 text-[#5A724A] flex items-center justify-center font-bold text-sm">
                                <User size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[#222222] truncate">{user.name}</p>
                                <p className="text-[10px] text-[#818181] capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname.startsWith(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group text-sm font-semibold ${isActive
                                    ? 'bg-[#5A724A] text-white shadow-[0_4px_14px_rgba(90,114,74,0.25)]'
                                    : 'text-[#818181] hover:text-[#222222] hover:bg-[#F4F6F0]'
                                    }`}
                            >
                                <Icon size={19} className={isActive ? "text-white" : "text-[#818181] group-hover:text-[#5A724A] transition-colors"} />
                                <span className="tracking-normal">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Live System Status Pill */}
                <div className="mt-auto mb-4 p-3 border border-[#EBEBEB] bg-[#F8F8F8] rounded-2xl">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#818181]">Kitchen &amp; POS</span>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-[#EBEBEB]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#5A724A] animate-pulse" />
                            <span className="text-[10px] text-[#5A724A] font-bold">ONLINE</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-2.5 text-[#818181] hover:text-red-600 transition-colors px-3 py-2 hover:bg-red-50 rounded-xl text-xs font-semibold"
                >
                    <LogOut size={16} />
                    <span>Exit Portal</span>
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full flex flex-col md:pl-64 min-h-screen relative">
                <OfflineBanner />
                <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
                    {/* Mobile Header */}
                    <header className="mb-6 flex justify-between items-center md:hidden bg-white p-4 rounded-2xl border border-[#EBEBEB] shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#5A724A] text-white flex items-center justify-center text-sm font-bold">
                                🌿
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-[#222222]">Herb &amp; Spice</h1>
                                {user && <p className="text-[10px] text-[#818181]">{user.name} • {user.role}</p>}
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#5A724A] animate-pulse" />
                    </header>

                    <Outlet />
                </div>

                {/* Ambient Decorative Shapes */}
                <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-40">
                    <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-[#BCE2A3]/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] left-[20%] w-[450px] h-[450px] bg-[#5A724A]/10 rounded-full blur-[130px]" />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#EBEBEB] z-50 px-3 pb-6 pt-2.5 flex overflow-x-auto justify-around gap-1 items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname.startsWith(link.path);
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex flex-col items-center shrink-0 min-w-14 py-1 transition-all ${isActive ? 'text-[#5A724A]' : 'text-[#818181] hover:text-[#222222]'}`}
                        >
                            <div className={`p-1.5 rounded-full mb-0.5 transition-all ${isActive ? 'bg-[#BCE2A3]/40' : ''}`}>
                                <Icon size={19} className={isActive ? "text-[#5A724A]" : "text-[#818181]"} />
                            </div>
                            <span className={`text-[10px] font-bold ${isActive ? 'text-[#5A724A]' : ''}`}>{link.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
