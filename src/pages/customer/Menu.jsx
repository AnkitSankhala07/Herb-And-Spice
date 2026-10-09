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

            {/* Floating Cart CTA - Pill-shaped Charcoal */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div 
                        initial={{ y: 80, x: '-50%' }}
                        animate={{ y: 0, x: '-50%' }}
                        exit={{ y: 80, x: '-50%' }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-40"
                    >
                        <Link to={`/table/${tableId}/cart`} className="block">
                            <div className="bg-[#222222] text-white rounded-full px-5 py-3.5 flex items-center justify-between shadow-[0_10px_30px_rgba(34,34,34,0.3)] hover:bg-black transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#5A724A] text-white rounded-full w-9 h-9 flex items-center justify-center relative font-bold">
                                        <ShoppingBag size={18} />
                                        <div className="absolute -top-1 -right-1 bg-[#BCE2A3] text-[#222222] text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                                            {totalItems}
                                        </div>
                                    </div>
                                    <span className="font-semibold text-sm tracking-wide">Review Order</span>
                                </div>
                                <div className="font-mono font-bold text-base text-[#BCE2A3]">
                                    ₹{total.toFixed(2)}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Assistant FAB Button */}
            <motion.button 
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAIChat(true)}
                className="fixed bottom-6 right-4 z-50 w-13 h-13 rounded-full bg-[#5A724A] text-white shadow-[0_6px_24px_rgba(90,114,74,0.35)] flex items-center justify-center group"
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
