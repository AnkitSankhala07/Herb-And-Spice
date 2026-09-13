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
        return menuItems.filter(item => item.isTrending);
    }, [menuItems]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#1C2B1A] text-[#F0E8D5] font-['DM_Sans'] pb-32">
            {/* SECTION 1 — HEADER ROW */}
            <header className="px-6 pt-8 mb-6 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="font-['Playfair_Display'] font-bold text-4xl text-[#F0E8D5]">
                        Menu
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="font-['Space_Mono'] text-[#C8973F] bg-[#C8973F]/15 border border-[#C8973F]/40 rounded-full px-3 py-1 text-sm">
                            Table {tableId || '??'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-[#3A8C72] w-2 h-2 rounded-full animate-pulse" />
                    <span className="text-[#3A8C72] text-xs font-['DM_Sans'] font-bold tracking-tight">Kitchen Live</span>
                </div>
            </header>

            {/* SECTION 2 — SEARCH BAR */}
            <div className="px-6 mb-8">
                <div className="relative group flex items-center bg-[#2C3C2A] border border-[#344530] rounded-xl focus-within:border-[#C8973F]/60 transition-all duration-300">
                    <div className="pl-4 text-[#5A7A56]">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search our flavors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-transparent outline-none px-3 font-['DM_Sans'] text-[#F0E8D5] placeholder-[#5A7A56] text-sm"
                    />
                </div>
            </div>

            {/* SECTION 3 — CATEGORY FILTER PILLS */}
            <div className="mb-8 pl-6">
                <CategoryFilter 
                    categories={dynamicCategories}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                />
            </div>

            {/* SECTION 4 — CHEF'S SELECTION HORIZONTAL SCROLL */}
            {!searchQuery && activeCategory === 'All' && chefSelections.length > 0 && (
                <div className="mb-10 pl-6">
                    <div className="flex items-center gap-2 mb-3 pr-6">
                        <Sparkles className="text-[#C8973F] text-sm" />
                        <h2 className="font-['DM_Sans'] uppercase tracking-widest text-xs text-[#5A7A56]">Chef's Selection</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pr-6">
                        {chefSelections.map(item => (
                            <motion.div 
                                key={item._id || item.id}
                                className="min-w-[280px] w-[280px]"
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

            {/* MAIN GRID */}
            <div className="px-6">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="font-['DM_Sans'] uppercase tracking-widest text-xs text-[#5A7A56]">
                        {searchQuery ? 'Search Results' : `${activeCategory} Items`}
                    </h2>
                </div>
                
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-[#243023] rounded-3xl border border-dashed border-[#344530]">
                        <p className="text-[#5A7A56] font-['DM_Sans']">No treats found in this category.</p>
                    </div>
                ) : (
                    <motion.div 
                        key={`${activeCategory}-${searchQuery}`}
                        className="grid grid-cols-2 gap-4"
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

            {/* SECTION 5 — FLOATING CART CTA */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div 
                        initial={{ y: 100, x: '-50%' }}
                        animate={{ y: 0, x: '-50%' }}
                        exit={{ y: 100, x: '-50%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-40"
                    >
                        <Link to={`/table/${tableId}/cart`} className="block">
                            <div className="bg-[#243023]/90 backdrop-blur-xl border border-[#344530] rounded-2xl px-4 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                <div className="flex items-center">
                                    <div className="bg-[#8B5E3C] rounded-xl w-9 h-9 flex items-center justify-center relative">
                                        <ShoppingBag size={20} className="text-[#FAF6EE]" />
                                        <div className="absolute top-0 right-0 bg-[#C8973F] text-[#1C2B1A] text-[10px] font-bold rounded-full -mt-1.5 -mr-1.5 w-5 h-5 flex items-center justify-center border-2 border-[#243023]">
                                            {totalItems}
                                        </div>
                                    </div>
                                    <span className="ml-4 font-['DM_Sans'] font-medium text-[#F0E8D5] text-sm">View Cart</span>
                                </div>
                                <div className="font-['Space_Mono'] text-[#C8973F] font-bold text-base">
                                    ₹{total.toFixed(2)}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SECTION 6 — AI CHATBOT FAB */}
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAIChat(true)}
                className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#8B5E3C] to-[#3D1A0A] shadow-[0_4px_20px_rgba(139,94,60,0.5)] flex items-center justify-center group"
            >
                <div className="absolute inset-0 rounded-full border-2 border-[#8B5E3C]/40 animate-ping pointer-events-none" />
                <span className="text-2xl transform group-hover:rotate-12 transition-transform">🌿</span>
            </motion.button>

            {/* AI Panel Component */}
            <AIChatPanel isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
        </div>
    );
};

export default Menu;
