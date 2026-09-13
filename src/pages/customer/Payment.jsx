import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { placeOrder } from '../../services/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const Payment = () => {
    const { tableId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    
    const [method, setMethod] = useState('upi');
    const [step, setStep] = useState('select'); // select, processing, success
    
    // Safety check if accessed directly
    const orderPayload = location.state?.orderPayload;

    useEffect(() => {
        if (!orderPayload) {
            navigate(`/table/${tableId}/cart`);
        }
    }, [orderPayload, navigate, tableId]);

    const handleMockPayment = async () => {
        setStep('processing');
        
        // Mock gateway delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            await placeOrder(orderPayload);
            setStep('success');
            clearCart();
            
            // Wait for success animation then redirect
            setTimeout(() => {
                navigate(`/table/${tableId}/status`);
            }, 1000);
            
        } catch (error) {
            console.error('Payment finalized but order failed', error);
            toast.error("Payment processed but failed to sync order. Please contact waiter.");
            setStep('select');
        }
    };

    if (!orderPayload) return null;

    if (step === 'processing') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                <h2 className="text-2xl font-display font-bold text-foreground-pale mb-2">Processing Payment</h2>
                <p className="text-muted text-sm max-w-xs">Please do not refresh or close this screen. Securing connection...</p>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-teal/20 text-teal rounded-full flex items-center justify-center mb-6"
                >
                    <CheckCircle size={48} />
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-foreground-pale mb-2">Payment Successful!</h2>
                <p className="text-muted text-sm mb-8">₹{orderPayload.totalAmount.toFixed(2)} received securely.</p>
                <p className="text-gold font-bold font-mono animate-pulse">Routing order to kitchen...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-32 pt-4 px-4 max-w-md mx-auto relative">
             <div className="flex items-center gap-3 mb-8">
                <Link to={`/table/${tableId}/cart`} className="p-2 hover:bg-surface rounded-full transition-colors text-muted hover:text-foreground">
                    <ArrowLeft size={20} />
                </Link>
                <h2 className="text-2xl font-display font-bold text-foreground-pale text-center flex-1">Secured Checkout</h2>
                <div className="p-2 text-teal opacity-50"><ShieldCheck size={20} /></div>
            </div>

            <div className="bg-surface p-6 rounded-2xl border border-border flex items-center justify-between mb-8 shadow-md">
                <span className="text-muted uppercase text-xs font-bold tracking-widest">Amount to Pay</span>
                <span className="text-3xl font-mono font-bold text-gold">₹{orderPayload.totalAmount.toFixed(2)}</span>
            </div>

            <h3 className="text-sm font-bold text-foreground-pale uppercase tracking-wide mb-4">Select Payment Method</h3>
            
            <div className="space-y-3 mb-10">
                <div 
                    onClick={() => setMethod('upi')}
                    className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${method === 'upi' ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(139,94,60,0.15)]' : 'bg-surface border-border hover:border-muted'}`}
                >
                    <div className={`p-3 rounded-xl ${method === 'upi' ? 'bg-primary text-background' : 'bg-elevated text-muted'}`}>
                        <Smartphone size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-foreground-pale">UPI / QR Code</h4>
                        <p className="text-xs text-muted mt-0.5">Google Pay, PhonePe, Paytm</p>
                    </div>
                    {method === 'upi' && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><div className="w-1.5 h-1.5 bg-background rounded-full" /></div>}
                </div>

                <div 
                    onClick={() => setMethod('card')}
                    className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${method === 'card' ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(139,94,60,0.15)]' : 'bg-surface border-border hover:border-muted'}`}
                >
                    <div className={`p-3 rounded-xl ${method === 'card' ? 'bg-primary text-background' : 'bg-elevated text-muted'}`}>
                        <CreditCard size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-foreground-pale">Credit / Debit Card</h4>
                        <p className="text-xs text-muted mt-0.5">Visa, Mastercard, RuPay</p>
                    </div>
                    {method === 'card' && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><div className="w-1.5 h-1.5 bg-background rounded-full" /></div>}
                </div>
            </div>

            <div className="text-center text-xs text-muted mb-6 flex flex-col items-center gap-1">
                <span>By continuing, you agree to our terms of service.</span>
                <span className="text-[10px] opacity-50 uppercase tracking-widest mt-2 block">(Online Payment Demo)</span>
            </div>

            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-background/90 backdrop-blur-md pb-8">
                <Button 
                    onClick={handleMockPayment}
                    className="w-full py-4 text-base font-bold shadow-xl shadow-primary/20 bg-linear-to-r from-primary to-gold border-none"
                >
                    Pay ₹{orderPayload.totalAmount.toFixed(2)} Securely
                </Button>
            </div>
        </div>
    );
};

export default Payment;
