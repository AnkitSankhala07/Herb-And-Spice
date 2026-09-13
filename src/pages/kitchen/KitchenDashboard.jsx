import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Clock, CheckCircle, ChefHat, AlertTriangle, History, ArrowLeft } from 'lucide-react';
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
            .catch(err => console.error("Failed to fetch orders"));

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
            // If order is marked Paid or Cancelled, remove it from the list
            if (updatedOrder.status === 'Paid' || updatedOrder.status === 'Cancelled') {
                setOrders(prev => prev.filter(o => o.id !== updatedOrder._id));
            } else {
                // Otherwise update the status
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
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-elevated border border-border rounded-xl shadow-[0_0_20px_rgba(200,151,63,0.1)]">
                        <ChefHat className="text-gold" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground-pale tracking-tight">Kitchen KDS</h1>
                        <p className="text-muted text-sm tracking-wide">Live Order Heatmap</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={showHistory ? () => setShowHistory(false) : handleShowHistory}
                        className={clsx(
                            "flex items-center gap-2 text-sm px-4 py-2 rounded-lg border shadow-sm font-bold transition-all",
                            showHistory
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-surface text-muted border-border hover:text-foreground hover:border-muted"
                        )}
                    >
                        {showHistory ? <><ArrowLeft size={16} /> Live KDS</> : <><History size={16} /> Order History</>}
                    </button>
                    {!showHistory && (
                        <>
                            <div className="flex items-center gap-2 text-sm text-foreground bg-surface px-4 py-2 rounded-lg border border-border shadow-sm">
                                <div className="w-2.5 h-2.5 rounded-full bg-teal shadow-[0_0_8px_rgba(58,140,114,0.8)]"></div> On Track
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground bg-surface px-4 py-2 rounded-lg border border-border shadow-sm">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber shadow-[0_0_8px_rgba(217,119,67,0.8)]"></div> Delayed
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground bg-surface px-4 py-2 rounded-lg border border-border shadow-sm">
                                <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse shadow-[0_0_8px_rgba(196,75,58,0.8)]"></div> Critical
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* HISTORY VIEW */}
            {showHistory ? (
                <Card className="bg-surface border-border shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-elevated/30 flex items-center justify-between">
                        <h2 className="font-display font-bold text-lg text-foreground-pale flex items-center gap-2">
                            <History size={18} className="text-gold" /> All Order History
                        </h2>
                        <span className="text-xs text-muted font-mono">{historyOrders.length} orders</span>
                    </div>
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                        </div>
                    ) : historyOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <History size={48} className="mb-4 text-muted" />
                            <p className="text-muted">No orders found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-elevated/20">
                                        <th className="text-left px-6 py-3 text-xs text-muted uppercase tracking-widest font-bold">Order ID</th>
                                        <th className="text-left px-6 py-3 text-xs text-muted uppercase tracking-widest font-bold">Table</th>
                                        <th className="text-left px-6 py-3 text-xs text-muted uppercase tracking-widest font-bold">Items</th>
                                        <th className="text-left px-6 py-3 text-xs text-muted uppercase tracking-widest font-bold">Total</th>
                                        <th className="text-left px-6 py-3 text-xs text-muted uppercase tracking-widest font-bold">Status</th>
                                        <th className="text-left px-6 py-3 text-xs text-muted uppercase tracking-widest font-bold">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyOrders.map((order) => {
                                        const statusColors = {
                                            'Pending': 'bg-amber/10 text-amber border-amber/20',
                                            'Preparing': 'bg-primary/10 text-primary border-primary/20',
                                            'Ready': 'bg-teal/10 text-teal border-teal/20',
                                            'Served': 'bg-gold/10 text-gold border-gold/20',
                                            'Paid': 'bg-muted/10 text-muted border-border',
                                            'Cancelled': 'bg-danger/10 text-danger border-danger/20'
                                        };
                                        const date = new Date(order.createdAt);
                                        return (
                                            <tr key={order._id} className="border-b border-border/50 hover:bg-elevated/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-muted">#{order._id.slice(-6)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-bold text-gold">T-{order.tableNumber}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[200px]">
                                                        {order.items.map((item, i) => (
                                                            <span key={i} className="text-foreground-pale">
                                                                {item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-foreground-pale">₹{order.totalAmount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border', statusColors[order.status] || 'bg-muted/10 text-muted border-border')}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-muted font-mono">
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
                </Card>
            ) : (
            /* LIVE KDS VIEW */

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:grid-rows-[auto_1fr] gap-6 items-start">
                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col justify-center items-center py-20 text-center opacity-50">
                        <ChefHat size={64} className="mb-4 text-muted" />
                        <h3 className="text-xl font-display font-bold text-foreground">No active orders</h3>
                        <p className="text-muted">Kitchen is clear for now.</p>
                    </div>
                )}

                <AnimatePresence>
                    {orders.map((order, idx) => {
                        const elapsed = getElapsedTime(order.time);
                        const progress = Math.min((elapsed / order.prepTime) * 100, 100);
                        const isDelayed = elapsed > order.prepTime;
                        const isCritical = elapsed > order.prepTime + 5;
                        const isReady = order.status === 'Ready';

                        const statusColor = isReady ? 'border-teal/30 grayscale opacity-60' :
                            isCritical ? 'border-danger shadow-[0_4px_30px_rgba(196,75,58,0.15)] ring-1 ring-danger/30' :
                                isDelayed ? 'border-amber shadow-[0_4px_30px_rgba(217,119,67,0.1)] ring-1 ring-amber/30' :
                                    'border-teal/50 hover:border-teal';

                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                key={order.id}
                            >
                                <Card className={clsx("h-full flex flex-col border transition-all duration-500 relative bg-surface overflow-hidden", statusColor)}>

                                    {/* Top colored bar to indicate status quickly */}
                                    <div className={clsx(
                                        "h-1.5 w-full absolute top-0 left-0",
                                        isReady ? "bg-teal/30" : isCritical ? "bg-danger" : isDelayed ? "bg-amber" : "bg-teal"
                                    )} />

                                    {/* Critical Badge */}
                                    {isCritical && !isReady && (
                                        <div className="absolute top-4 right-4 bg-danger/20 border border-danger/50 text-danger text-[10px] px-2 py-1 rounded shadow-lg flex items-center gap-1 font-bold tracking-wider uppercase backdrop-blur-sm animate-pulse">
                                            <AlertTriangle size={12} /> Overdue
                                        </div>
                                    )}

                                    <div className="px-5 pt-6 pb-4 border-b border-border/50 flex justify-between items-center bg-elevated/30">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-xl text-gold tracking-tighter">T-{order.tableNumber}</span>
                                            <span className="text-muted text-xs opacity-50">#{order.id.slice(-4)}</span>
                                        </div>
                                        {!isCritical && <Badge status={order.status} />}
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between text-muted mb-5 text-xs font-medium uppercase tracking-wider">
                                            <div className="flex items-center gap-2 bg-elevated px-2 py-1 rounded border border-border">
                                                <Clock size={12} className={clsx(isCritical ? "text-danger" : isDelayed ? "text-amber" : "text-teal")} />
                                                <span className="font-mono">{order.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <span className={clsx(
                                                "font-bold font-mono text-sm",
                                                isCritical ? "text-danger" : isDelayed ? "text-amber" : "text-teal"
                                            )}>{elapsed}m</span>
                                        </div>

                                        <ul className="mb-6 space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                            {order.items.map((item, i) => (
                                                <li key={i} className="flex justify-between items-start gap-4 pb-3 border-b border-border/30 last:border-0 last:pb-0">
                                                    <div>
                                                        <span className="font-bold text-foreground-pale text-base leading-tight block">{item.name || "Item"}</span>
                                                        {item.specialInstructions && (
                                                            <span className="text-[11px] text-amber mt-1 inline-block leading-tight bg-amber/10 px-2 py-0.5 rounded">
                                                                * {item.specialInstructions}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="bg-elevated border border-border text-foreground font-mono font-bold px-2 py-1 rounded text-sm shrink-0">
                                                        x{item.quantity}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Prep Time Progress Bar */}
                                        {!isReady && (
                                            <div className="mb-5 mt-auto bg-elevated p-3 rounded-lg border border-border">
                                                <div className="flex justify-between text-[10px] text-muted mb-2 font-bold uppercase tracking-wider">
                                                    <span>Target: {order.prepTime}m</span>
                                                    <span>{Math.round(progress)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={clsx("h-full rounded-full transition-all duration-1000",
                                                            isCritical ? "bg-danger shadow-[0_0_8px_rgba(196,75,58,0.8)]" :
                                                                isDelayed ? "bg-amber shadow-[0_0_8px_rgba(217,119,67,0.8)]" :
                                                                    "bg-teal shadow-[0_0_8px_rgba(58,140,114,0.8)]"
                                                        )}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2 mt-auto">
                                            {order.status === 'Pending' && (
                                                <Button
                                                    onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                                                    className="w-full justify-center bg-teal text-background hover:bg-teal/90 shadow-[0_4px_15px_-3px_rgba(58,140,114,0.4)] border-none font-bold"
                                                >
                                                    Start Preparing
                                                </Button>
                                            )}
                                            {order.status === 'Preparing' && (
                                                <Button
                                                    onClick={() => handleUpdateStatus(order.id, 'Ready')}
                                                    variant="primary"
                                                    className="w-full justify-center shadow-[0_4px_15px_-3px_rgba(139,94,60,0.4)]"
                                                >
                                                    Mark as Ready
                                                </Button>
                                            )}
                                            {order.status === 'Ready' && (
                                                <Button
                                                    onClick={() => handleUpdateStatus(order.id, 'Served')}
                                                    variant="outline"
                                                    className="w-full justify-center border-teal text-teal hover:bg-teal/10"
                                                >
                                                    <CheckCircle size={18} className="mr-2" /> Mark Served
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
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
