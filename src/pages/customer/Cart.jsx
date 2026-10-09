import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag, Receipt, CreditCard, Clock } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { placeOrder } from '../../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, total, clearCart } = useCart();
    const { tableId } = useParams();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tipPct, setTipPct] = useState(0);
    const [payMode, setPayMode] = useState('later');

    const gst = total * 0.05;
    const tipAmount = total * (tipPct / 100);
    const finalTotal = total + gst + tipAmount;

    const handlePlaceOrder = async () => {
        setIsSubmitting(true);
        const orderPayload = {
            tableNumber: tableId || "0",
            items: cartItems.map(item => ({
                menuItem: (item._id || item.id).toString(),
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: Number(finalTotal.toFixed(2)),
            tip: Number(tipAmount.toFixed(2))
        };

        try {
            if (payMode === 'now') {
                navigate(`/table/${tableId}/payment`, { state: { orderPayload } });
                return;
            }

            await placeOrder(orderPayload);

            toast.success("Order Placed Successfully!");
            clearCart();
            navigate(`/table/${tableId}/status`);
        } catch (error) {
            console.error("Order Failed:", error);
            const message = error?.response?.data?.message || "Failed to place order. Please try again.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 border border-[#EBEBEB] shadow-[0_8px_24px_rgba(90,114,74,0.08)]">
                    <ShoppingBag size={36} className="text-[#5A724A]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#222222] mb-1.5">Your Cart is Empty</h2>
                <p className="text-[#818181] text-xs mb-8 max-w-xs leading-relaxed">You haven't selected any dishes yet. Explore our handcrafted creations!</p>
                <Link to={`/table/${tableId}/menu`}>
                    <Button variant="primary" className="rounded-full px-8 py-3.5 shadow-sm">
                        Browse Full Menu
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-64 pt-2 max-w-md mx-auto relative min-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#F4F6F0]/95 backdrop-blur-md z-40 py-2">
                <div className="flex items-center gap-3">
                    <Link to={`/table/${tableId}/menu`} className="w-9 h-9 bg-white border border-[#EBEBEB] rounded-full flex items-center justify-center text-[#818181] hover:text-[#222222] transition-colors shadow-xs">
                        <ArrowLeft size={18} />
                    </Link>
                    <h2 className="text-xl font-extrabold text-[#222222]">Review Order</h2>
                </div>
                <div className="bg-[#BCE2A3]/30 border border-[#BCE2A3] px-3 py-1 rounded-full text-xs font-mono font-bold text-[#425934]">
                    Table {tableId || '??'}
                </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 mb-6">
                {cartItems.map(item => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={item._id || item.id}
                        className="bg-white p-3.5 rounded-3xl shadow-[0_4px_16px_rgba(90,114,74,0.04)] border border-[#EBEBEB] flex gap-3.5 items-center"
                    >
                        <div className="w-18 h-18 rounded-2xl bg-[#F4F6F0] border border-[#EBEBEB] flex items-center justify-center overflow-hidden shrink-0">
                            {item.image || item.imageUrl ? (
                                <img src={item.image || item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                                <span className="text-2xl">🌿</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-sm text-[#222222] truncate leading-tight">{item.name}</h3>
                                <button
                                    onClick={() => removeFromCart(item._id || item.id)}
                                    className="text-[#818181] hover:text-red-500 p-1 transition-colors"
                                    aria-label="Remove item"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                            <div className="flex justify-between items-center mt-2.5">
                                <span className="font-bold text-[#5A724A] text-sm tracking-tight">₹{item.price * item.quantity}</span>
                                <div className="flex items-center gap-2 bg-[#F4F6F0] border border-[#EBEBEB] rounded-full px-1.5 py-0.5">
                                    <button
                                        onClick={() => updateQuantity(item._id || item.id, -1)}
                                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#5A724A] shadow-2xs hover:bg-[#5A724A] hover:text-white transition-colors"
                                    >
                                        <Minus size={12} strokeWidth={2.5} />
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center text-[#222222] font-mono">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item._id || item.id, 1)}
                                        className="w-6 h-6 rounded-full bg-[#5A724A] text-white flex items-center justify-center shadow-2xs hover:bg-[#485D3B] transition-colors"
                                    >
                                        <Plus size={12} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Promo Code Box */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Enter promo or voucher code"
                    className="flex-1 bg-white border border-[#EBEBEB] rounded-full px-4 py-2.5 text-xs text-[#222222] focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 outline-none placeholder:text-[#818181]"
                />
                <Button variant="outline" className="rounded-full px-5 text-xs font-bold py-2.5">Apply</Button>
            </div>

            {/* Tip Selector */}
            <div className="mb-6 bg-white p-4 rounded-3xl border border-[#EBEBEB] shadow-xs">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-xs text-[#222222] uppercase tracking-wider">Kitchen &amp; Server Tip</h4>
                    <span className="text-[11px] text-[#818181]">Recognize exceptional craft</span>
                </div>
                <div className="flex gap-2">
                    {[0, 5, 10, 15].map(pct => (
                        <button
                            key={pct}
                            onClick={() => setTipPct(pct)}
                            className={clsx(
                                "flex-1 py-2 rounded-full text-xs font-bold transition-all border",
                                tipPct === pct
                                    ? "bg-[#5A724A] text-white border-[#5A724A] shadow-xs"
                                    : "bg-[#F8F8F8] text-[#818181] border-[#EBEBEB] hover:text-[#222222]"
                            )}
                        >
                            {pct === 0 ? 'None' : `${pct}%`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-6 grid grid-cols-2 gap-3">
                <div
                    onClick={() => setPayMode('later')}
                    className={clsx(
                        "p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-1.5",
                        payMode === 'later'
                            ? "bg-[#BCE2A3]/25 border-[#5A724A] text-[#222222] shadow-xs"
                            : "bg-white border-[#EBEBEB] text-[#818181] hover:text-[#222222]"
                    )}
                >
                    <div className={clsx("p-2 rounded-full", payMode === 'later' ? "bg-[#5A724A] text-white" : "bg-[#F8F8F8] text-[#818181]")}>
                        <Clock size={16} />
                    </div>
                    <span className="text-xs font-bold">Pay at Table Later</span>
                </div>
                <div
                    onClick={() => setPayMode('now')}
                    className={clsx(
                        "p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-1.5",
                        payMode === 'now'
                            ? "bg-[#BCE2A3]/25 border-[#5A724A] text-[#222222] shadow-xs"
                            : "bg-white border-[#EBEBEB] text-[#818181] hover:text-[#222222]"
                    )}
                >
                    <div className={clsx("p-2 rounded-full", payMode === 'now' ? "bg-[#5A724A] text-white" : "bg-[#F8F8F8] text-[#818181]")}>
                        <CreditCard size={16} />
                    </div>
                    <span className="text-xs font-bold">Pay Online Now</span>
                </div>
            </div>

            {/* Sticky Bottom Actions Container */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl p-5 shadow-[0_-8px_32px_rgba(90,114,74,0.08)] rounded-t-3xl border-t border-[#EBEBEB] z-50">
                <div className="space-y-1.5 mb-4 text-xs">
                    <div className="flex justify-between text-[#818181]">
                        <span>Subtotal</span>
                        <span className="font-mono text-[#222222] font-semibold">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#818181]">
                        <span>GST (5%)</span>
                        <span className="font-mono text-[#222222] font-semibold">₹{gst.toFixed(2)}</span>
                    </div>
                    {tipAmount > 0 && (
                        <div className="flex justify-between text-[#5A724A] font-semibold">
                            <span>Service Tip ({tipPct}%)</span>
                            <span className="font-mono">₹{tipAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-[#EBEBEB] flex justify-between items-center">
                        <span className="font-bold text-sm text-[#222222]">Total Due</span>
                        <span className="text-xl font-mono font-extrabold text-[#5A724A]">₹{finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                <Button
                    onClick={handlePlaceOrder}
                    variant="charcoal"
                    className="w-full py-4 text-sm font-bold shadow-[0_6px_20px_rgba(34,34,34,0.25)] rounded-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Sending to Kitchen..." : (payMode === 'now' ? "Proceed to Payment" : `Confirm Order • ₹${finalTotal.toFixed(2)}`)}
                </Button>
            </div>
        </div>
    );
};

export default Cart;
