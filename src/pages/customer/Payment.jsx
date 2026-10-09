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
    
    const orderPayload = location.state?.orderPayload;

    useEffect(() => {
        if (!orderPayload) {
            navigate(`/table/${tableId}/cart`);
        }
    }, [orderPayload, navigate, tableId]);

    const handleMockPayment = async () => {
        setStep('processing');
        
        await new Promise(resolve => setTimeout(resolve, 1800));
        
        try {
            await placeOrder(orderPayload);
            setStep('success');
            clearCart();
            
            setTimeout(() => {
                navigate(`/table/${tableId}/status`);
            }, 1200);
            
        } catch (error) {
            console.error('Payment finalized but order failed', error);
            toast.error("Payment processed but failed to sync order. Please contact waiter.");
            setStep('select');
        }
    };

    if (!orderPayload) return null;

    if (step === 'processing') {
        return (
            <div className="min-h-screen bg-[#F4F6F0] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#EBEBEB]">
                    <Loader2 className="w-10 h-10 text-[#5A724A] animate-spin" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#222222] mb-1.5">Securing Payment</h2>
                <p className="text-[#818181] text-xs max-w-xs leading-relaxed">Connecting to payment gateway... Please do not close this window.</p>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-[#F4F6F0] flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-[#BCE2A3]/40 text-[#425934] border border-[#BCE2A3] rounded-full flex items-center justify-center mb-6 shadow-sm"
                >
                    <CheckCircle size={40} />
                </motion.div>
                <h2 className="text-3xl font-extrabold text-[#222222] mb-1.5">Payment Successful!</h2>
                <p className="text-[#818181] text-xs mb-6">₹{orderPayload.totalAmount.toFixed(2)} received securely.</p>
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#EBEBEB] text-xs font-bold text-[#5A724A]">
                    <span className="w-2 h-2 rounded-full bg-[#5A724A] animate-pulse" />
                    Sending ticket to kitchen...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F6F0] pb-32 pt-2 max-w-md mx-auto relative">
             <div className="flex items-center gap-3 mb-6">
                <Link to={`/table/${tableId}/cart`} className="w-9 h-9 bg-white border border-[#EBEBEB] rounded-full flex items-center justify-center text-[#818181] hover:text-[#222222] transition-colors shadow-xs">
                    <ArrowLeft size={18} />
                </Link>
                <h2 className="text-xl font-extrabold text-[#222222] flex-1">Secure Checkout</h2>
                <div className="p-2 text-[#5A724A]"><ShieldCheck size={20} /></div>
            </div>

            {/* Total Banner */}
            <div className="bg-white p-5 rounded-3xl border border-[#EBEBEB] flex items-center justify-between mb-6 shadow-xs">
                <div>
                    <span className="text-[#818181] uppercase text-[10px] font-bold tracking-wider">Total Amount</span>
                    <p className="text-xs text-[#818181]">Includes GST &amp; tips</p>
                </div>
                <span className="text-2xl font-mono font-extrabold text-[#5A724A]">₹{orderPayload.totalAmount.toFixed(2)}</span>
            </div>

            <h3 className="text-xs font-bold text-[#818181] uppercase tracking-wider mb-3">Select Payment Method</h3>
            
            <div className="space-y-3 mb-8">
                <div 
                    onClick={() => setMethod('upi')}
                    className={`p-4 rounded-3xl border flex items-center gap-3.5 cursor-pointer transition-all ${method === 'upi' ? 'bg-[#BCE2A3]/25 border-[#5A724A] shadow-xs' : 'bg-white border-[#EBEBEB] hover:border-[#818181]'}`}
                >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${method === 'upi' ? 'bg-[#5A724A] text-white' : 'bg-[#F8F8F8] text-[#818181]'}`}>
                        <Smartphone size={22} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-[#222222] text-sm">UPI / QR Payment</h4>
                        <p className="text-[11px] text-[#818181] mt-0.5">Google Pay, PhonePe, Paytm, BHIM</p>
                    </div>
                    {method === 'upi' && (
                        <div className="w-5 h-5 rounded-full bg-[#5A724A] flex items-center justify-center text-white">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    )}
                </div>

                <div 
                    onClick={() => setMethod('card')}
                    className={`p-4 rounded-3xl border flex items-center gap-3.5 cursor-pointer transition-all ${method === 'card' ? 'bg-[#BCE2A3]/25 border-[#5A724A] shadow-xs' : 'bg-white border-[#EBEBEB] hover:border-[#818181]'}`}
                >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${method === 'card' ? 'bg-[#5A724A] text-white' : 'bg-[#F8F8F8] text-[#818181]'}`}>
                        <CreditCard size={22} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-[#222222] text-sm">Credit / Debit Card</h4>
                        <p className="text-[11px] text-[#818181] mt-0.5">Visa, Mastercard, RuPay</p>
                    </div>
                    {method === 'card' && (
                        <div className="w-5 h-5 rounded-full bg-[#5A724A] flex items-center justify-center text-white">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center text-xs text-[#818181] mb-6 flex flex-col items-center gap-1">
                <span>Transactions are SSL 256-bit encrypted</span>
                <span className="text-[10px] text-[#5A724A] font-semibold uppercase tracking-wider">(Herb &amp; Spice Pay Demo)</span>
            </div>

            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/95 backdrop-blur-md pb-6 border-t border-[#EBEBEB] rounded-t-3xl">
                <Button 
                    onClick={handleMockPayment}
                    variant="primary"
                    className="w-full py-4 text-sm font-bold shadow-[0_6px_20px_rgba(90,114,74,0.25)] rounded-full"
                >
                    Pay ₹{orderPayload.totalAmount.toFixed(2)} Securely
                </Button>
            </div>
        </div>
    );
};

export default Payment;
