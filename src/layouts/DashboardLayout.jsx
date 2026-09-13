import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart, LogOut, ShoppingCart, UtensilsCrossed, QrCode, BrainCircuit, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { OfflineBanner } from '../components/ui/OfflineBanner';

export default function DashboardLayout({ role = 'admin' }) {
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const links = role === 'admin' ? [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
        { name: 'Inventory', path: '/admin/inventory', icon: ClipboardList },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart },
        { name: 'AI Forecast', path: '/admin/forecast', icon: BrainCircuit },
        { name: 'Tables', path: '/admin/tables', icon: QrCode },
    ] : role === 'waiter' ? [
        { name: 'Floor Plan', path: '/waiter/dashboard', icon: LayoutDashboard },
        { name: 'Active Orders', path: '/waiter/orders', icon: ShoppingCart },
    ] : [
        { name: 'Kitchen Display', path: '/kitchen/dashboard', icon: LayoutDashboard },
    ];

    return (
        <div className="flex min-h-screen bg-desktop-bg text-foreground font-body pb-24 md:pb-0">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 border-r border-border bg-surface/80 backdrop-blur-xl p-6 hidden md:flex flex-col fixed inset-y-0 z-40">
                <div className="mb-10 pl-2">
                    <h2 className="text-2xl font-display font-bold text-foreground">
                        Herbs & Spices<span className="text-primary">.</span>
                    </h2>
                    <p className="text-xs text-muted uppercase tracking-wider mt-1 font-medium">
                        {role} Workspace
                    </p>
                </div>

                {/* User Profile Section */}
                {user && (
                    <div className="mb-8 p-4 bg-elevated/50 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <User size={20} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                                <p className="text-xs text-muted capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="space-y-2 flex-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname.startsWith(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted hover:text-foreground hover:bg-elevated'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                                )}
                                <Icon size={20} className={isActive ? "text-primary" : "group-hover:text-foreground transition-colors"} />
                                <span className="font-medium tracking-wide text-sm">{link.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* System Status - Futuristic */}
                <div className="mt-auto mb-6 p-4 border border-border bg-surface rounded-2xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase tracking-widest text-muted">System Status</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-teal-500 animate-pulse" />
                            <span className="text-[10px] text-teal-500 font-mono">ONLINE</span>
                        </div>
                    </div>
                </div>

                <button onClick={() => window.location.href = '/'} className="flex items-center gap-3 text-muted hover:text-danger transition-colors px-4 py-2 hover:bg-danger/10 rounded-lg">
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Disconnect</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full flex flex-col md:pl-64 min-h-screen relative">
                <OfflineBanner />
                <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="mb-6 md:mb-10 flex justify-between items-center md:hidden bg-surface/50 p-4 rounded-2xl border border-border backdrop-blur-sm">
                        <div>
                            <h1 className="text-lg font-display font-bold">Herbs & Spices</h1>
                            {user && <p className="text-xs text-muted">{user.name} • {user.role}</p>}
                        </div>
                        <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                    </header>
                    <Outlet />
                </div>

                {/* Background Ambient */}
                <div className="fixed inset-0 pointer-events-none z-[-1]">
                    <div className="absolute top-[20%] right-[10%] w-125 h-125 bg-primary/5 rounded-full blur-[120px]" />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border z-50 px-2 pb-6 pt-3 flex overflow-x-auto justify-between gap-2 items-center custom-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname.startsWith(link.path);
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex flex-col items-center shrink-0 min-w-16 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-foreground-pale'}`}
                        >
                            <div className={`p-2 rounded-xl mb-1 transition-all ${isActive ? 'bg-primary/20 shadow-inner' : ''}`}>
                                <Icon size={20} className={isActive ? "text-primary" : "opacity-80"} />
                            </div>
                            <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-primary' : ''}`}>{link.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div >
    );
}
