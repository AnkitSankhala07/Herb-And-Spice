import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Clock, CheckCircle, ChefHat, AlertTriangle, History, ArrowLeft, Utensils } from 'lucide-react';
import clsx from 'clsx';
import { getKitchenOrders, updateOrderStatus, socket, api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const KitchenDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showHistory, setShowHistory] = useState(false);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        getKitchenOrders()
            .then(data => {
                const formatted = data.map(o => ({
                    ...o,
                    id: o._id,
                    time: new Date(o.createdAt),
                    prepTime: o.estimatedPrepTime || 15
                }));
                setOrders(formatted.sort((a, b) => a.time - b.time));
            })
            .catch(err => console.error("Failed to fetch orders", err));

        const timer = setInterval(() => setCurrentTime(new Date()), 30000);

        socket.on('new_order', (newOrder) => {
            const formatted = {
                ...newOrder,
                id: newOrder._id,
                time: new Date(newOrder.createdAt),
                prepTime: newOrder.estimatedPrepTime || 15
            };
            setOrders(prev => [...prev, formatted].sort((a, b) => a.time - b.time));
        });

        socket.on('order_status_update', (updatedOrder) => {
            if (updatedOrder.status === 'Paid' || updatedOrder.status === 'Cancelled') {
                setOrders(prev => prev.filter(o => o.id !== updatedOrder._id));
            } else {
                setOrders(prev => prev.map(o => o.id === updatedOrder._id ? { ...o, status: updatedOrder.status } : o));
            }
        });

        return () => {
            clearInterval(timer);
            socket.off('new_order');
            socket.off('order_status_update');
        };
    }, []);

    const handleUpdateStatus = async (id, status) => {
        if (!id) return;
        try {
            const updated = await updateOrderStatus(id, status);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: updated.status } : o));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const getElapsedTime = (orderTime) => Math.floor((currentTime - orderTime) / 60000) || 0;

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const { data } = await api.get('/orders?history=true');
            setHistoryOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleShowHistory = () => {
        setShowHistory(true);
        fetchHistory();
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Top Bar */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#BCE2A3]/30 border border-[#BCE2A3]/60 flex items-center justify-center text-[#5A724A] shadow-sm">
                        <ChefHat size={30} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Kitchen KDS</h1>
                            <span className="text-xs font-bold uppercase tracking-wider bg-[#5A724A]/10 text-[#5A724A] px-2.5 py-0.5 rounded-full border border-[#5A724A]/20">
                                Live Heatmap
                            </span>
                        </div>
                        <p className="text-[#818181] text-sm mt-0.5">Real-time prep station orders and target timers</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={showHistory ? () => setShowHistory(false) : handleShowHistory}
                        className={clsx(
                            "flex items-center gap-2 text-sm px-5 py-2.5 rounded-full border font-bold transition-all shadow-sm",
                            showHistory
                                ? "bg-[#5A724A] text-white border-[#5A724A]"
                                : "bg-white text-[#222222] border-[#EBEBEB] hover:border-[#5A724A] hover:bg-[#F8F8F8]"
                        )}
                    >
                        {showHistory ? <><ArrowLeft size={16} /> Live Station</> : <><History size={16} /> Order History</>}
                    </button>

                    {!showHistory && (
                        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-[#EBEBEB] shadow-sm text-xs font-semibold text-[#222222]">
                            <div className="flex items-center gap-1.5 px-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#5A724A]"></span>
                                <span>On Track</span>
                            </div>
                            <div className="w-px h-3.5 bg-[#EBEBEB]"></div>
                            <div className="flex items-center gap-1.5 px-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#E2A34A]"></span>
                                <span>Delayed</span>
                            </div>
                            <div className="w-px h-3.5 bg-[#EBEBEB]"></div>
                            <div className="flex items-center gap-1.5 px-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#D9534F] animate-pulse"></span>
                                <span>Critical</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* HISTORY VIEW */}
            {showHistory ? (
                <div className="bg-white border border-[#EBEBEB] rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#EBEBEB] bg-[#F8F8F8] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History size={20} className="text-[#5A724A]" />
                            <h2 className="font-bold text-lg text-[#222222]">Complete Order History</h2>
                        </div>
                        <span className="text-xs text-[#818181] font-bold bg-white px-3 py-1 rounded-full border border-[#EBEBEB]">
                            {historyOrders.length} orders
                        </span>
                    </div>

                    {historyLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#5A724A]/20 border-t-[#5A724A] rounded-full animate-spin" />
                        </div>
                    ) : historyOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-[#818181]">
                            <History size={48} className="mb-4 opacity-40 text-[#5A724A]" />
                            <p className="font-semibold text-lg text-[#222222]">No historical orders found</p>
                            <p className="text-sm">Processed orders will appear in this log.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#EBEBEB] bg-[#F8F8F8]/60">
                                        <th className="text-left px-6 py-3.5 text-xs text-[#818181] uppercase tracking-wider font-bold">Order ID</th>
                                        <th className="text-left px-6 py-3.5 text-xs text-[#818181] uppercase tracking-wider font-bold">Table</th>
                                        <th className="text-left px-6 py-3.5 text-xs text-[#818181] uppercase tracking-wider font-bold">Items</th>
                                        <th className="text-left px-6 py-3.5 text-xs text-[#818181] uppercase tracking-wider font-bold">Total</th>
                                        <th className="text-left px-6 py-3.5 text-xs text-[#818181] uppercase tracking-wider font-bold">Status</th>
                                        <th className="text-left px-6 py-3.5 text-xs text-[#818181] uppercase tracking-wider font-bold">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EBEBEB]">
                                    {historyOrders.map((order) => {
                                        const date = new Date(order.createdAt);
                                        return (
                                            <tr key={order._id} className="hover:bg-[#F8F8F8]/80 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs font-semibold text-[#818181]">#{order._id.slice(-6)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-black text-sm bg-[#5A724A]/10 text-[#5A724A] px-3 py-1 rounded-full border border-[#5A724A]/20">
                                                        T-{order.tableNumber}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[260px] text-xs font-medium text-[#222222]">
                                                        {order.items.map((item, i) => (
                                                            <span key={i}>
                                                                {item.name} <strong className="text-[#5A724A]">×{item.quantity}</strong>{i < order.items.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-[#222222]">₹{order.totalAmount}</td>
                                                <td className="px-6 py-4">
                                                    <Badge status={order.status} />
                                                </td>
                                                <td className="px-6 py-4 text-xs text-[#818181] font-mono">
                                                    {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* LIVE KDS VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                    {orders.length === 0 && (
                        <div className="col-span-full flex flex-col justify-center items-center py-28 text-center bg-white border border-[#EBEBEB] rounded-3xl p-8 shadow-sm">
                            <div className="w-20 h-20 rounded-full bg-[#BCE2A3]/30 flex items-center justify-center text-[#5A724A] mb-4">
                                <Utensils size={36} />
                            </div>
                            <h3 className="text-2xl font-bold text-[#222222]">All Caught Up!</h3>
                            <p className="text-[#818181] mt-1 max-w-sm">No pending orders in the kitchen queue. New customer orders will appear automatically.</p>
                        </div>
                    )}

                    <AnimatePresence>
                        {orders.map((order) => {
                            const elapsed = getElapsedTime(order.time);
                            const progress = Math.min((elapsed / order.prepTime) * 100, 100);
                            const isDelayed = elapsed > order.prepTime;
                            const isCritical = elapsed > order.prepTime + 5;
                            const isReady = order.status === 'Ready';

                            const cardBorder = isReady
                                ? 'border-[#5A724A]/30 opacity-70 bg-[#F8F8F8]'
                                : isCritical
                                    ? 'border-[#D9534F] ring-2 ring-[#D9534F]/30 bg-white'
                                    : isDelayed
                                        ? 'border-[#E2A34A] ring-2 ring-[#E2A34A]/30 bg-white'
                                        : 'border-[#EBEBEB] hover:border-[#5A724A]/50 bg-white';

                            const barColor = isReady
                                ? 'bg-[#5A724A]/40'
                                : isCritical
                                    ? 'bg-[#D9534F]'
                                    : isDelayed
                                        ? 'bg-[#E2A34A]'
                                        : 'bg-[#5A724A]';

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.25 }}
                                    key={order.id}
                                >
                                    <div className={clsx("rounded-3xl border shadow-sm transition-all duration-300 relative overflow-hidden flex flex-col h-full", cardBorder)}>
                                        {/* Status Top Strip */}
                                        <div className={clsx("h-1.5 w-full", barColor)} />

                                        {/* Critical Badge */}
                                        {isCritical && !isReady && (
                                            <div className="absolute top-4 right-4 bg-[#D9534F]/15 border border-[#D9534F]/40 text-[#D9534F] text-[10px] px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 font-bold tracking-wider uppercase animate-pulse">
                                                <AlertTriangle size={12} /> Overdue
                                            </div>
                                        )}

                                        {/* Ticket Header */}
                                        <div className="px-5 pt-5 pb-3 border-b border-[#EBEBEB] flex justify-between items-center bg-[#F8F8F8]/60">
                                            <div className="flex items-center gap-3">
                                                <span className="font-extrabold text-2xl text-[#222222] tracking-tight">
                                                    T-{order.tableNumber}
                                                </span>
                                                <span className="text-[#818181] text-xs font-mono font-medium">#{order.id.slice(-4)}</span>
                                            </div>
                                            {!isCritical && <Badge status={order.status} />}
                                        </div>

                                        {/* Ticket Body */}
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between text-xs mb-4">
                                                <div className="flex items-center gap-1.5 bg-[#F8F8F8] px-2.5 py-1 rounded-full border border-[#EBEBEB] text-[#818181]">
                                                    <Clock size={12} className={clsx(isCritical ? "text-[#D9534F]" : isDelayed ? "text-[#E2A34A]" : "text-[#5A724A]")} />
                                                    <span className="font-mono font-medium">{order.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <span className={clsx(
                                                    "font-bold font-mono text-sm px-2.5 py-0.5 rounded-full",
                                                    isCritical ? "bg-[#D9534F]/10 text-[#D9534F]" : isDelayed ? "bg-[#E2A34A]/10 text-[#E2A34A]" : "bg-[#5A724A]/10 text-[#5A724A]"
                                                )}>
                                                    {elapsed}m
                                                </span>
                                            </div>

                                            {/* Order Items */}
                                            <ul className="mb-5 space-y-2.5 flex-1 overflow-y-auto pr-1">
                                                {order.items.map((item, i) => (
                                                    <li key={i} className="flex justify-between items-start gap-3 pb-2.5 border-b border-[#EBEBEB]/70 last:border-0 last:pb-0">
                                                        <div>
                                                            <span className="font-bold text-[#222222] text-sm leading-snug block">{item.name || "Item"}</span>
                                                            {item.specialInstructions && (
                                                                <span className="text-[11px] text-[#5A724A] font-semibold mt-0.5 inline-block bg-[#BCE2A3]/30 px-2 py-0.5 rounded-md">
                                                                    Note: {item.specialInstructions}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="bg-[#F8F8F8] border border-[#EBEBEB] text-[#222222] font-black px-2.5 py-0.5 rounded-full text-xs shrink-0">
                                                            ×{item.quantity}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* Prep Progress */}
                                            {!isReady && (
                                                <div className="mb-4 mt-auto bg-[#F8F8F8] p-3 rounded-2xl border border-[#EBEBEB]">
                                                    <div className="flex justify-between text-[10px] text-[#818181] mb-1.5 font-bold uppercase tracking-wider">
                                                        <span>Target: {order.prepTime}m</span>
                                                        <span>{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-[#EBEBEB] rounded-full overflow-hidden">
                                                        <div
                                                            className={clsx("h-full rounded-full transition-all duration-500", barColor)}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="pt-1 mt-auto">
                                                {order.status === 'Pending' && (
                                                    <Button
                                                        onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                                                        className="w-full justify-center bg-[#5A724A] hover:bg-[#4d623f] text-white rounded-full font-bold shadow-sm py-2.5"
                                                    >
                                                        Start Preparing
                                                    </Button>
                                                )}
                                                {order.status === 'Preparing' && (
                                                    <Button
                                                        onClick={() => handleUpdateStatus(order.id, 'Ready')}
                                                        className="w-full justify-center bg-[#222222] hover:bg-black text-white rounded-full font-bold shadow-sm py-2.5"
                                                    >
                                                        Mark as Ready
                                                    </Button>
                                                )}
                                                {order.status === 'Ready' && (
                                                    <Button
                                                        onClick={() => handleUpdateStatus(order.id, 'Served')}
                                                        variant="outline"
                                                        className="w-full justify-center border-2 border-[#5A724A] text-[#5A724A] hover:bg-[#5A724A]/10 rounded-full font-bold py-2.5"
                                                    >
                                                        <CheckCircle size={16} className="mr-1.5" /> Mark Served
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default KitchenDashboard;
