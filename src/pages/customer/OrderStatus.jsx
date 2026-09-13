import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ChefHat, User, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { socket } from '../../services/api';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STEPS = [
    { status: 'Pending', label: 'Order Sent', icon: Clock },
    { status: 'Preparing', label: 'Kitchen Preparing', icon: ChefHat },
    { status: 'Ready', label: 'Ready to Serve', icon: CheckCircle },
    { status: 'Served', label: 'Enjoy your meal!', icon: User },
];

const OrderStatus = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Pending');

    useEffect(() => {
        // Convert tableId to number for comparison since API returns numbers
        const tableNumber = parseInt(tableId, 10);
        
        socket.on('order_status_update', (updatedOrder) => {
            console.log('📡 Order status update:', { tableId: tableNumber, orderTable: updatedOrder.tableNumber, status: updatedOrder.status });
            
            // Compare as numbers to ensure proper matching
            if (Number(updatedOrder.tableNumber) === tableNumber) {
                setStatus(updatedOrder.status);
                console.log('✅ Status updated for table', tableNumber, ':', updatedOrder.status);

                // Show a toast notification for each status change
                const messages = {
                    'Preparing': { text: '👨‍🍳 Your food is being prepared!', icon: '🔥' },
                    'Ready': { text: '✅ Your order is ready to serve!', icon: '🎉' },
                    'Served': { text: '🍽️ Enjoy your meal!', icon: '😋' },
                };
                const msg = messages[updatedOrder.status];
                if (msg) {
                    toast(msg.text, {
                        icon: msg.icon,
                        duration: 4000,
                        style: { background: '#243023', color: '#F0E8D5', border: '1px solid #344530' },
                    });
                }
            }
        });

        return () => {
            socket.off('order_status_update');
        };
    }, [tableId]);

    const currentStepIndex = STEPS.findIndex(s => s.status === status);

    return (
        <div className="p-4 flex flex-col items-center min-h-[80vh] max-w-md mx-auto relative">
            <div className="text-center mb-10 pt-8">
                <h1 className="text-3xl font-display font-bold mb-2 text-foreground-pale tracking-tight">Order Status</h1>
                <div className="inline-flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-full shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                    <p className="text-gold font-mono text-sm uppercase tracking-wider">ORD-2024-0852</p>
                </div>
            </div>

            <div className="w-full bg-surface/50 border border-border p-6 rounded-3xl shadow-xl backdrop-blur-md relative overflow-hidden">
                {/* SVG Connecting Line Background */}
                <div className="absolute left-10 top-12 bottom-12 w-0.5 bg-border z-0"></div>

                {/* Progress fill line */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    className="absolute left-10 top-12 bottom-12 w-0.5 bg-linear-to-b from-teal to-gold z-0 shadow-[0_0_10px_#3A8C72]"
                />

                <div className="space-y-10 relative z-10">
                    {STEPS.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.status} className="relative flex items-center gap-6">
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: isCurrent ? 1.1 : 1 }}
                                    className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative bg-surface z-10",
                                        isCompleted
                                            ? (isCurrent ? 'border-gold text-gold shadow-[0_0_15px_rgba(200,151,63,0.4)]' : 'border-teal text-teal bg-teal/10')
                                            : 'border-border text-muted bg-elevated'
                                    )}
                                >
                                    {isCurrent && (
                                        <span className="absolute inset-0 rounded-full border border-gold animate-ping opacity-50"></span>
                                    )}
                                    <Icon size={18} />
                                </motion.div>
                                <div className="text-left flex-1 bg-elevated/40 border border-border/50 px-4 py-3 rounded-2xl">
                                    <h3 className={clsx(
                                        "font-bold text-base transition-colors",
                                        isCurrent ? 'text-gold' : isCompleted ? 'text-teal' : 'text-muted'
                                    )}>
                                        {step.label}
                                    </h3>
                                    {isCurrent && <p className="text-muted text-xs mt-1">Estimated ~8 min</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {status === 'Served' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 w-full max-w-sm"
                    >
                        <div className="bg-surface border border-border p-6 rounded-2xl shadow-xl text-center">
                            <Sparkles size={24} className="text-gold mx-auto mb-3" />
                            <p className="mb-4 text-sm font-bold text-foreground">How was your meal?</p>
                            <div className="flex gap-2 justify-center mb-6 bg-elevated p-3 rounded-full border border-border">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} className="text-2xl hover:scale-125 transition-transform drop-shadow-md">⭐</button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-8 flex w-full gap-3 border-t border-border/50 pt-8">
                <Button 
                    variant="outline" 
                    className="flex-1 bg-surface border-border hover:bg-surface/80 transition-colors"
                    onClick={() => {
                        socket.emit('call_waiter', { tableId });
                        toast.success('Waiter notified!', { 
                            icon: '🔔',
                            style: { background: '#243023', color: '#F0E8D5', border: '1px solid #C8973F' }
                        });
                    }}
                >
                    Call Waiter
                </Button>
                <Button onClick={() => navigate(`/table/${tableId}/menu`)} className="flex-1">Order More</Button>
            </div>
        </div>
    );
};

export default OrderStatus;
