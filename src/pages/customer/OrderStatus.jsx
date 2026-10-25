import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ChefHat, User, Sparkles, Bell, Receipt, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { socket, api } from '../../services/api';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STEPS = [
    { status: 'Pending', label: 'Order Received', icon: Clock },
    { status: 'Preparing', label: 'Kitchen Preparing', icon: ChefHat },
    { status: 'Ready', label: 'Ready to Serve', icon: CheckCircle },
    { status: 'Served', label: 'Enjoy your meal!', icon: User },
];

const OrderStatus = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Pending');
    const [billData, setBillData] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const fetchBill = useCallback(async () => {
        if (!tableId) return;
        try {
            const response = await api.get(`/orders/table/${tableId}/active`);
            if (response.data) {
                setBillData(response.data);
                if (response.data.status && response.data.status !== 'None') {
                    setStatus(response.data.status);
                }
            }
        } catch (err) {
            console.error('Failed to load table bill:', err);
        }
    }, [tableId]);

    useEffect(() => {
        fetchBill();
    }, [fetchBill]);

    useEffect(() => {
        const tableNumber = parseInt(tableId, 10);
        
        socket.on('order_status_update', (updatedOrder) => {
            console.log('📡 Order status update:', { tableId: tableNumber, orderTable: updatedOrder.tableNumber, status: updatedOrder.status });
            
            if (Number(updatedOrder.tableNumber) === tableNumber) {
                setStatus(updatedOrder.status);
                fetchBill();

                const messages = {
                    'Preparing': { text: '👨‍🍳 Your dishes are currently on the fire!', icon: '🔥' },
                    'Ready': { text: '✅ Your order is ready to serve!', icon: '🎉' },
                    'Served': { text: '🍽️ Enjoy your artisan meal!', icon: '🌿' },
                };
                const msg = messages[updatedOrder.status];
                if (msg) {
                    toast(msg.text, {
                        icon: msg.icon,
                        duration: 4000,
                    });
                }
            }
        });

        socket.on('table_update', (data) => {
            if (!data?.tableId || Number(data.tableId) === tableNumber) {
                fetchBill();
            }
        });

        return () => {
            socket.off('order_status_update');
            socket.off('table_update');
        };
    }, [tableId, fetchBill]);

    const handleDownloadBill = async () => {
        setIsDownloading(true);
        try {
            const response = await api.get(`/reports/bill/table/${tableId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `table-${tableId}-bill.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`Bill downloaded for Table ${tableId}`);
        } catch (err) {
            console.error('Failed to download bill:', err);
            toast.error(err?.response?.data?.message || 'Failed to download bill');
        } finally {
            setIsDownloading(false);
        }
    };

    const currentStepIndex = Math.max(0, STEPS.findIndex(s => s.status === status));

    return (
        <div className="pt-4 flex flex-col items-center min-h-[80vh] max-w-md mx-auto relative">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 bg-[#BCE2A3]/30 border border-[#BCE2A3] px-3.5 py-1 rounded-full text-xs font-bold text-[#425934] mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#5A724A] animate-pulse" />
                    <span>Table {tableId || '??'} Live Status</span>
                </div>
                <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Order Tracking</h1>
                <p className="text-xs text-[#818181] mt-1">Real-time status synced with kitchen</p>
            </div>

            {/* Stepper Card */}
            <div className="w-full bg-white border border-[#EBEBEB] p-6 rounded-3xl shadow-[0_8px_30px_rgba(90,114,74,0.06)] relative overflow-hidden">
                {/* Connecting Line Track */}
                <div className="absolute left-11 top-12 bottom-12 w-0.5 bg-[#EBEBEB] z-0" />

                {/* Progress fill line */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="absolute left-11 top-12 bottom-12 w-0.5 bg-[#5A724A] z-0 shadow-xs"
                />

                <div className="space-y-8 relative z-10">
                    {STEPS.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.status} className="relative flex items-center gap-5">
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: isCurrent ? 1.08 : 1 }}
                                    className={clsx(
                                        "w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 shadow-xs",
                                        isCompleted
                                            ? (isCurrent ? 'bg-[#5A724A] border-[#5A724A] text-white shadow-[0_4px_14px_rgba(90,114,74,0.35)]' : 'border-[#5A724A] text-[#5A724A] bg-[#BCE2A3]/30')
                                            : 'border-[#EBEBEB] text-[#818181] bg-[#F8F8F8]'
                                    )}
                                >
                                    {isCurrent && (
                                        <span className="absolute inset-0 rounded-full border-2 border-[#5A724A] animate-ping opacity-35" />
                                    )}
                                    <Icon size={18} />
                                </motion.div>

                                <div className={clsx(
                                    "text-left flex-1 px-4 py-3 rounded-2xl border transition-all",
                                    isCurrent ? "bg-[#F4F6F0] border-[#BCE2A3]" : "bg-[#F8F8F8] border-[#EBEBEB]"
                                )}>
                                    <h3 className={clsx(
                                        "font-bold text-sm",
                                        isCurrent ? 'text-[#5A724A]' : isCompleted ? 'text-[#222222]' : 'text-[#818181]'
                                    )}>
                                        {step.label}
                                    </h3>
                                    {isCurrent && <p className="text-[#818181] text-[11px] mt-0.5 font-medium">Estimated ~8-12 min</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Meal Rating Card if Served */}
            <AnimatePresence>
                {status === 'Served' && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 w-full"
                    >
                        <div className="bg-white border border-[#EBEBEB] p-5 rounded-3xl shadow-xs text-center">
                            <Sparkles size={22} className="text-[#5A724A] mx-auto mb-2" />
                            <p className="text-xs font-bold text-[#222222] mb-3">How did you enjoy your dishes?</p>
                            <div className="flex gap-2 justify-center bg-[#F8F8F8] p-2.5 rounded-full border border-[#EBEBEB] max-w-xs mx-auto">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => toast.success(`Thank you for giving ${star} stars!`)}
                                        className="text-xl hover:scale-125 transition-transform"
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live Bill Summary Card */}
            {billData && billData.totalAmount > 0 && (
                <div className="w-full mt-6 bg-white border border-[#EBEBEB] p-5 rounded-3xl shadow-[0_8px_30px_rgba(90,114,74,0.06)] text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#5A724A]/10 text-[#5A724A] flex items-center justify-center">
                                <Receipt size={15} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#222222]">Live Table Bill</span>
                        </div>
                        <span className="text-[11px] font-mono text-[#818181] bg-[#F8F8F8] px-2.5 py-0.5 rounded-full border border-[#EBEBEB]">
                            {billData.items?.length || 0} item(s)
                        </span>
                    </div>

                    {/* Item list */}
                    {billData.items && billData.items.length > 0 && (
                        <div className="py-3 space-y-1.5 border-b border-[#EBEBEB] max-h-36 overflow-y-auto pr-1">
                            {billData.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-[#555555]">
                                    <span className="truncate pr-2">{item.name} <span className="text-[#818181]">× {item.quantity}</span></span>
                                    <span className="font-mono text-[#222222] font-semibold shrink-0">₹{item.itemTotal.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tax & Breakdown */}
                    <div className="py-2.5 space-y-1 text-xs text-[#818181]">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-mono">₹{billData.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>GST (5%)</span>
                            <span className="font-mono">₹{billData.tax.toFixed(2)}</span>
                        </div>
                        {billData.tip > 0 && (
                            <div className="flex justify-between">
                                <span>Tip</span>
                                <span className="font-mono">₹{billData.tip.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* TOTAL DUE BANNER */}
                    <div className="pt-3 border-t border-[#EBEBEB] flex items-baseline justify-between">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-[#222222]">Total Due</span>
                            <p className="text-[10px] text-[#818181]">Including all taxes &amp; fees</p>
                        </div>
                        <span className="text-2xl font-mono font-extrabold text-[#5A724A]">
                            ₹{billData.totalAmount.toFixed(2)}
                        </span>
                    </div>

                    {/* Download Bill PDF */}
                    <button
                        onClick={handleDownloadBill}
                        disabled={isDownloading}
                        className="mt-4 w-full py-2.5 px-4 bg-[#F8F8F8] hover:bg-[#BCE2A3]/30 border border-[#EBEBEB] rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#5A724A] transition-all"
                    >
                        {isDownloading ? (
                            <div className="w-3.5 h-3.5 border-2 border-[#5A724A] border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Download size={14} />
                        )}
                        <span>{isDownloading ? "Generating Bill PDF..." : "Download Official Bill (PDF)"}</span>
                    </button>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex w-full gap-3">
                <Button 
                    variant="outline" 
                    className="flex-1 rounded-full py-3.5 text-xs font-bold"
                    onClick={() => {
                        socket.emit('call_waiter', { tableId });
                        toast.success('Staff notified! A server will be right with you.', { icon: '🔔' });
                    }}
                >
                    <Bell size={15} />
                    Call Waiter
                </Button>
                <Button 
                    variant="primary"
                    onClick={() => navigate(`/table/${tableId}/menu`)} 
                    className="flex-1 rounded-full py-3.5 text-xs font-bold"
                >
                    Order More
                </Button>
            </div>
        </div>
    );
};

export default OrderStatus;
