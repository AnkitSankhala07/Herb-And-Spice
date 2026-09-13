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
                // For pay-now flow, place order after mock payment completes.
                navigate(`/table/${tableId}/payment`, { state: { orderPayload } });
                return;
            }

            await placeOrder(orderPayload);

            toast.success("Order Placed Successfully!", { style: { background: '#243023', color: '#F0E8D5' } });
            clearCart();
            navigate(`/table/${tableId}/status`);
        } catch (error) {
            console.error("Order Failed:", error);
            const message = error?.response?.data?.message || "Failed to place order. Please try again.";
            toast.error(message, { style: { background: '#C44B3A', color: '#fff' } });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                <div className="bg-surface p-6 rounded-full mb-6 border border-border shadow-[0_0_30px_rgba(139,94,60,0.1)]">
                    <ShoppingBag size={48} className="text-muted opacity-50" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground-pale mb-2">Cart is empty</h2>
                <p className="text-muted mb-8 max-w-xs leading-relaxed">Looks like you haven't added any dishes to your order yet.</p>
                <Link to={`/table/${tableId}/menu`}>
                    <Button variant="primary">Browse Full Menu</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-64 pt-4 px-4 max-w-md mx-auto relative min-h-[90vh]">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/90 backdrop-blur-md z-40 py-2">
                <div className="flex items-center gap-3">
                    <Link to={`/table/${tableId}/menu`} className="p-2 hover:bg-surface rounded-full transition-colors text-muted hover:text-foreground">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-2xl font-display font-bold text-foreground-pale">Checkout</h2>
                </div>
                <div className="bg-surface border border-border px-3 py-1 rounded-full text-xs font-mono text-gold shadow-sm">
                    Table {tableId || '07'}
                </div>
            </div>

            <div className="space-y-4 mb-8">
                {cartItems.map(item => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={item.id}
                        className="bg-surface p-4 rounded-xl shadow-md border border-border flex gap-4"
                    >
                        <div className="w-20 h-20 rounded-lg bg-elevated border border-border flex items-center justify-center overflow-hidden">
                            {item.image || item.imageUrl ? (
                                <img src={item.image || item.imageUrl} className="w-full h-full object-cover opacity-80" alt={item.name} />
                            ) : (
                                <span className="text-3xl">{item.emoji || '🍲'}</span>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-sm text-foreground-pale line-clamp-2 leading-tight">{item.name}</h3>
                                <button onClick={() => removeFromCart(item.id)} className="text-danger/60 p-1 hover:bg-danger/10 hover:text-danger rounded transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="font-mono font-bold text-gold text-sm tracking-tight">₹{item.price * item.quantity}</span>
                                <div className="flex items-center gap-3 bg-elevated inner-shadow rounded-lg p-1 border border-border">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-muted hover:text-gold transition-colors">
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-sm font-bold w-4 text-center text-foreground font-mono">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-muted hover:text-gold transition-colors">
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Promo Code */}
            <div className="flex gap-2 mb-8">
                <input
                    type="text"
                    placeholder="Have a promo code?"
                    className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:border-gold/50 outline-none placeholder:text-muted/50"
                />
                <Button variant="ghost" className="bg-elevated border border-border">Apply</Button>
            </div>

            {/* Tip Selector */}
            <div className="mb-8 bg-surface p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm text-foreground">Add a Tip</h4>
                    <span className="text-xs text-muted">For the lovely staff</span>
                </div>
                <div className="flex gap-2">
                    {[0, 5, 10, 15].map(pct => (
                        <button
                            key={pct}
                            onClick={() => setTipPct(pct)}
                            className={clsx(
                                "flex-1 py-2 rounded-lg text-sm font-bold transition-colors border",
                                tipPct === pct
                                    ? "bg-primary/20 text-primary border-primary/50"
                                    : "bg-elevated text-muted border-border hover:bg-elevated/80"
                            )}
                        >
                            {pct === 0 ? 'None' : `${pct}%`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-8 grid grid-cols-2 gap-3">
                <div
                    onClick={() => setPayMode('later')}
                    className={clsx(
                        "p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2",
                        payMode === 'later' ? "bg-primary/10 border-primary" : "bg-surface border-border hover:bg-elevated"
                    )}
                >
                    <div className={clsx("p-2 rounded-full", payMode === 'later' ? "bg-primary/20 text-primary" : "bg-elevated text-muted")}>
                        <Clock size={20} />
                    </div>
                    <span className="text-xs font-bold">Pay Later</span>
                </div>
                <div
                    onClick={() => setPayMode('now')}
                    className={clsx(
                        "p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2",
                        payMode === 'now' ? "bg-teal/10 border-teal" : "bg-surface border-border hover:bg-elevated"
                    )}
                >
                    <div className={clsx("p-2 rounded-full", payMode === 'now' ? "bg-teal/20 text-teal" : "bg-elevated text-muted")}>
                        <CreditCard size={20} />
                    </div>
                    <span className="text-xs font-bold">Pay Now</span>
                </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/95 backdrop-blur-xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] rounded-t-3xl border-t border-border z-50">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-muted">
                        <span>Items Subtotal</span>
                        <span className="font-mono">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted">
                        <span>GST (5%)</span>
                        <span className="font-mono">₹{gst.toFixed(2)}</span>
                    </div>
                    {tipAmount > 0 && (
                        <div className="flex justify-between text-sm text-muted">
                            <span>Staff Tip</span>
                            <span className="font-mono text-gold">₹{tipAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-border flex justify-between items-center">
                        <span className="font-bold text-foreground">Grand Total</span>
                        <span className="text-2xl font-mono font-bold text-gold">₹{finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                <Button
                    onClick={handlePlaceOrder}
                    className="w-full py-4 text-base font-bold shadow-[0_4px_20px_-4px_rgba(139,94,60,0.4)]"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Processing..." : (payMode === 'now' ? "Proceed to Payment" : `Place Order • ₹${finalTotal.toFixed(2)}`)}
                </Button>
            </div>
        </div>
    );
};

export default Cart;
