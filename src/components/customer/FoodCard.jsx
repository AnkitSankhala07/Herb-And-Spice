import { useCart } from '../../context/CartContext';
import { Plus, Minus, Star, Flame } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const FoodCard = ({ item, onClick }) => {
    const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();

    const itemId = item._id || item.id;
    const cartItem = cartItems.find((c) => (c._id || c.id) === itemId);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleMinus = (e) => {
        e.stopPropagation();
        if (quantity === 1) {
            removeFromCart(itemId);
        } else if (quantity > 1) {
            updateQuantity(itemId, -1);
        }
    };

    const handlePlus = (e) => {
        e.stopPropagation();
        if (quantity === 0) {
            addToCart(item);
        } else {
            updateQuantity(itemId, 1);
        }
    };

    return (
        <div
            onClick={onClick}
            className={clsx(
                "flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 cursor-pointer transition-transform hover:scale-[1.02]",
                !item.isAvailable && "opacity-70 grayscale"
            )}
        >
            {/* Image Box */}
            <div className="relative aspect-[4/3] w-full bg-gray-100 shrink-0">
                <img
                    src={item.image || item.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=FF6B6B&color=fff&size=400`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                />

                {/* Top Left Badge */}
                {item.isPopular && !item.isTrending && (
                    <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-br-2xl flex items-center gap-1 shadow-md">
                        <Star size={12} fill="currentColor" /> POPULAR
                    </div>
                )}
                {item.isTrending && (
                    <div className="absolute top-0 left-0 bg-[#FF6B6B] text-white text-[10px] font-bold px-3 py-1.5 rounded-br-2xl flex items-center gap-1 shadow-md">
                        <Flame size={12} fill="currentColor" /> TRENDING
                    </div>
                )}

                {/* Top Right Badge */}
                <div className={clsx(
                    "absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm tracking-widest",
                    item.isVeg ? "bg-[#10B981] text-white" : "bg-[#FF6B6B] text-white"
                )}>
                    {item.isVeg ? "VEG" : "NON-VEG"}
                </div>

                {!item.isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                        <span className="bg-white text-gray-900 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">
                            Sold Out
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight line-clamp-2">
                        {item.name}
                    </h3>
                    <span className="font-bold text-[#FF6B6B] text-base sm:text-lg whitespace-nowrap">
                        <span className="text-xs">₹</span>{item.price}
                    </span>
                </div>

                <div className="flex items-center text-[10px] sm:text-xs text-gray-400 mb-2 gap-1.5 font-medium">
                    <span>{item.calories || "500"} cal</span>
                    <span>•</span>
                    <span>~{item.preparationTime || "15"} min prep</span>
                </div>

                <p className="text-[11px] sm:text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {item.description || "Incredibly delicious."}
                </p>

                <div className="mt-auto h-10 w-full shrink-0" onClick={(e) => e.stopPropagation()}>
                    <AnimatePresence mode="popLayout" initial={false}>
                        {quantity === 0 ? (
                            <motion.button
                                key="add"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handlePlus}
                                disabled={!item.isAvailable}
                                className="w-full h-full bg-[#FF6B6B] hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-colors text-sm shadow-md shadow-[#FF6B6B]/30"
                            >
                                <Plus size={16} strokeWidth={3} /> Add
                            </motion.button>
                        ) : (
                            <motion.div
                                key="stepper"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-2 shadow-sm"
                            >
                                <button onClick={handleMinus} className="w-7 h-7 flex items-center justify-center text-[#FF6B6B] bg-white rounded-lg shadow-sm border border-red-100">
                                    <Minus size={16} strokeWidth={3} />
                                </button>
                                <span className="font-bold text-gray-900 text-base">{quantity}</span>
                                <button onClick={handlePlus} className="w-7 h-7 flex items-center justify-center bg-[#FF6B6B] text-white rounded-lg shadow-sm">
                                    <Plus size={16} strokeWidth={3} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
