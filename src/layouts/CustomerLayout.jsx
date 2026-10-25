import { Outlet, useParams, Link } from 'react-router-dom';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

export default function CustomerLayout() {
    const { tableId } = useParams();
    const { totalItems } = useCart();

    return (
        <div className="min-h-screen bg-[#F4F6F0] text-[#222222] pb-24 selection:bg-[#BCE2A3] selection:text-[#222222]">
            <OfflineBanner />
            
            {/* Top Navbar */}
            <nav className="sticky top-0 z-50 border-b border-[#EBEBEB] bg-white/90 backdrop-blur-md px-4 sm:px-5 py-3.5 flex justify-between items-center transition-all">
                <Link to={tableId ? `/table/${tableId}` : '/'} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-full bg-[#5A724A] flex items-center justify-center text-white text-sm shadow-xs font-bold group-hover:scale-105 transition-transform">
                        🌿
                    </div>
                    <div>
                        <h1 className="text-base font-extrabold tracking-tight text-[#222222] leading-none">
                            Herb &amp; Spice
                        </h1>
                        <span className="text-[10px] uppercase tracking-wider text-[#818181] font-semibold">Artisan Kitchen</span>
                    </div>
                </Link>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BCE2A3]/30 border border-[#BCE2A3]">
                        <div className="h-2 w-2 rounded-full bg-[#5A724A] animate-pulse" />
                        <span className="text-xs font-mono font-bold text-[#425934]">
                            T-{tableId || '?'}
                        </span>
                    </div>

                    {tableId && (
                        <Link
                            to={`/table/${tableId}/cart`}
                            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white border border-[#EBEBEB] text-[#222222] hover:bg-[#F4F6F0] active:scale-95 transition-all shadow-xs"
                            aria-label="View Cart"
                        >
                            <ShoppingBag size={17} className={totalItems > 0 ? "text-[#5A724A]" : "text-[#818181]"} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#5A724A] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    )}
                </div>
            </nav>

            <main className="container mx-auto p-4 max-w-md relative z-0">
                <Outlet />
            </main>

            {/* Organic Ambient Background Accents */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-60">
                <div className="absolute top-[-10%] right-[-15%] w-[420px] h-[420px] bg-[#BCE2A3]/25 rounded-full blur-[90px]" />
                <div className="absolute bottom-[5%] left-[-15%] w-[380px] h-[380px] bg-[#5A724A]/10 rounded-full blur-[100px]" />
            </div>
        </div>
    );
}
