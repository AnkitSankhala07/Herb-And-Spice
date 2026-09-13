import { Outlet, useParams } from 'react-router-dom';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { motion } from 'framer-motion';

export default function CustomerLayout() {
    const { tableId } = useParams();

    return (
        <div className="min-h-screen bg-background pb-20 selection:bg-primary selection:text-white">
            <OfflineBanner />
            {/* Glassmorphic Top Navbar */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-4 flex justify-between items-center">
                <h1 className="text-xl font-display font-bold tracking-tight text-foreground">
                    Herbs & Spices 🌿
                </h1>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-mono text-gold px-2 py-1 rounded-md bg-surface border border-border">
                        T-{tableId || '?'}
                    </span>
                </div>
            </nav>

            <main className="container mx-auto p-4 max-w-md relative z-0">
                <Outlet />
            </main>

            {/* Background Texture/Gradient for depth */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" />
            </div>
        </div>
    );
}
