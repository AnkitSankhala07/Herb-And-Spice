import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Sparkles, Navigation, ChevronRight } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { FoodCard } from '../../components/customer/FoodCard';
import CategoryFilter from '../../components/customer/CategoryFilter';
import AIChatPanel from '../../components/customer/AIChatPanel';
import { MENU_ITEMS, CATEGORIES } from '../../services/mockData';
import { api, socket } from '../../services/api';
import toast from 'react-hot-toast';

const Menu = () => {
    const { tableId } = useParams();
    const { cartItems, total, totalItems, addToCart } = useCart();
    
    // State
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [showAIChat, setShowAIChat] = useState(false);

    // Fetch Menu
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await api.get('/menu');
                const data = res.data || [];
                setMenuItems(data.length > 0 ? data : MENU_ITEMS);
                setIsLoading(false);
            } catch (error) {
                console.error("Error loading menu:", error);
                setMenuItems(MENU_ITEMS);
                setIsLoading(false);
            }
        };
        fetchMenu();
    }, []);

    // Derived Data
    const dynamicCategories = useMemo(() => {
        const uniqueCats = Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean);
        return ['All', ...uniqueCats];
    }, [menuItems]);

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menuItems, searchQuery, activeCategory]);

    const chefSelections = useMemo(() => {
        return menuItems.filter(item => item.isTrending || item.isPopular);
    }, [menuItems]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#F4F6F0] text-[#222222] font-body pb-32">
            {/* Header Row */}
            <header className="pt-2 mb-6 flex items-end justify-between">
                <div>
                    <h1 className="font-extrabold text-3xl sm:text-4xl text-[#222222] tracking-tight">
                        Our Menu
                    </h1>
                    <p className="text-xs text-[#818181] mt-1 font-medium">Crafted with fresh botanical herbs &amp; spices</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-[#EBEBEB] px-3 py-1 rounded-full shadow-xs">
                    <div className="bg-[#5A724A] w-2 h-2 rounded-full animate-pulse" />
                    <span className="text-[#5A724A] text-[11px] font-bold tracking-tight">Kitchen Active</span>
                </div>
            </header>

            {/* Search Bar - Pill-shaped */}
            <div className="mb-6">
                <div className="relative flex items-center bg-white border border-[#EBEBEB] rounded-full shadow-xs focus-within:border-[#5A724A] focus-within:ring-2 focus-within:ring-[#5A724A]/10 transition-all">
                    <div className="pl-4 text-[#818181]">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search dishes, burgers, pizzas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 bg-transparent outline-none px-3 text-[#222222] placeholder:text-[#818181] text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mr-3 text-xs text-[#818181] hover:text-[#222222] bg-[#F8F8F8] px-2 py-0.5 rounded-full"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="mb-7 -mx-4 px-4">
                <CategoryFilter 
                    categories={dynamicCategories}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                />
            </div>

            {/* Chef's Selection Horizontal Reel */}
            {!searchQuery && activeCategory === 'All' && chefSelections.length > 0 && (
                <div className="mb-8 -mx-4 pl-4">
                    <div className="flex items-center justify-between mb-3 pr-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">✨</span>
                            <h2 className="uppercase tracking-wider text-xs font-bold text-[#5A724A]">Featured Highlights</h2>
                        </div>
                        <span className="text-[11px] text-[#818181]">Handcrafted</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pr-4 pb-2 snap-x">
                        {chefSelections.slice(0, 4).map(item => (
                            <motion.div 
                                key={item._id || item.id}
                                className="min-w-[260px] w-[260px] snap-center"
                                initial="hidden"
                                animate="visible"
                                variants={itemVariants}
                            >
                                <FoodCard item={item} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Menu Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="uppercase tracking-wider text-xs font-bold text-[#818181]">
                        {searchQuery ? `Results for "${searchQuery}"` : `${activeCategory} Items`}
                    </h2>
                    <span className="text-xs text-[#818181] font-mono">{filteredItems.length} items</span>
                </div>
                
                {filteredItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#EBEBEB]">
                        <p className="text-3xl mb-2">🌿</p>
                        <p className="text-[#818181] text-sm font-medium">No dishes found matching your selection.</p>
                    </div>
                ) : (
                    <motion.div 
                        key={`${activeCategory}-${searchQuery}`}
                        className="grid grid-cols-2 gap-3.5 sm:gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {filteredItems.map((item) => (
                            <motion.div key={item._id || item.id} variants={itemVariants}>
                                <FoodCard item={item} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Floating Cart CTA - User-Friendly & Mobile-Friendly */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div 
                        initial={{ y: 90, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 90, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="fixed bottom-4 sm:bottom-6 left-0 right-0 px-3.5 sm:px-6 z-40 flex justify-center pointer-events-none"
                    >
                        <Link 
                            to={`/table/${tableId}/cart`} 
                            className="pointer-events-auto w-full max-w-md block group active:scale-[0.98] transition-transform duration-150"
                        >
                            <div className="bg-[#1A1A1A] text-white rounded-2xl sm:rounded-full p-2.5 sm:p-3 pl-3.5 sm:pl-4 flex items-center justify-between shadow-[0_12px_36px_rgba(26,26,26,0.35)] border border-[#333333]/70 backdrop-blur-md">
                                {/* Left Section: Item Count & Total Amount */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-full bg-[#5A724A] text-white flex items-center justify-center shadow-inner">
                                        <ShoppingBag size={20} className="transition-transform group-hover:scale-105" />
                                        <div className="absolute -top-1.5 -right-1.5 bg-[#BCE2A3] text-[#1A1A1A] text-[11px] font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-xs">
                                            {totalItems}
                                        </div>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-extrabold text-base sm:text-lg text-white font-mono tracking-tight leading-none">
                                                ₹{total.toFixed(2)}
                                            </span>
                                            <span className="text-[11px] text-[#818181] font-semibold">
                                                • {totalItems} {totalItems === 1 ? 'item' : 'items'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-[#BCE2A3] font-medium truncate mt-0.5">
                                            Tap to review order &amp; checkout
                                        </span>
                                    </div>
                                </div>

                                {/* Right Section: View Cart Action Pill */}
                                <div className="flex items-center gap-1 bg-[#5A724A] group-hover:bg-[#485D3B] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full shadow-xs transition-colors shrink-0 ml-2">
                                    <span>View Cart</span>
                                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Assistant FAB Button - Dynamic Lift to prevent overlapping floating cart on mobile */}
            <motion.button 
                initial={false}
                animate={{ 
                    bottom: totalItems > 0 ? 86 : 20 
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAIChat(true)}
                className="fixed right-4 z-30 w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#5A724A] text-white shadow-[0_6px_24px_rgba(90,114,74,0.35)] flex items-center justify-center group"
                aria-label="Open AI Culinary Concierge"
            >
                <div className="absolute inset-0 rounded-full border-2 border-[#BCE2A3] animate-ping opacity-40 pointer-events-none" />
                <span className="text-xl transform group-hover:rotate-12 transition-transform">🌿</span>
            </motion.button>

            {/* AI Panel Component */}
            <AIChatPanel isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
        </div>
    );
};

export default Menu;
