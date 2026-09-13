import { useState, useEffect } from 'react';
import { api, socket } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ChefHat, Package, IndianRupee, Eye, Download } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    'Pending': { color: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/20', icon: Clock },
    'Preparing': { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: ChefHat },
    'Ready': { color: 'text-teal', bg: 'bg-teal/10', border: 'border-teal/20', icon: Package },
    'Served': { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: CheckCircle2 },
    'Paid': { color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20', icon: IndianRupee }
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDownloadingBill, setIsDownloadingBill] = useState(false);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/orders');
            setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        
        socket.on('new_order', (order) => {
            setOrders(prev => [order, ...prev.filter(o => o._id !== order._id)]);
            toast.success("New Order Received!");
        });

        socket.on('order_status_update', (updatedOrder) => {
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
            if (selectedOrder && selectedOrder._id === updatedOrder._id) {
                setSelectedOrder(updatedOrder);
            }
        });

        const interval = setInterval(fetchOrders, 10000);
        return () => {
            clearInterval(interval);
            socket.off('new_order');
            socket.off('order_status_update');
        };
    }, [selectedOrder]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleDownloadBill = async (orderId) => {
        setIsDownloadingBill(true);
        try {
            const response = await api.get(`/reports/bill/${orderId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `customer-bill-${orderId.slice(-6)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Bill downloaded successfully");
        } catch (error) {
            console.error('Failed to download bill:', error);
            toast.error("Failed to generate bill");
        } finally {
            setIsDownloadingBill(false);
        }
    };

    return (
        <div className="text-foreground max-w-full">
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground-pale mb-1 tracking-tight">Active Operations</h1>
                    <p className="text-muted text-sm tracking-wide">Monitor orders across all tables in real-time.</p>
                </div>
                <div className="flex bg-surface p-1 rounded-xl border border-border shadow-inner self-start">
                    <div className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-primary text-background shadow-[0_4px_15px_-3px_rgba(139,94,60,0.4)]">
                        Active Orders: {orders.filter(o => !['Paid', 'Served'].includes(o.status)).length}
                    </div>
                </div>
            </div>

            <Card className="bg-surface border-border p-6 shadow-xl relative overflow-hidden min-h-[500px]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="overflow-x-auto relative z-10">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20">
                            <Package size={48} className="mx-auto mb-4 text-muted opacity-50" />
                            <h3 className="text-lg font-bold text-foreground-pale">No Orders Yet</h3>
                            <p className="text-muted">Orders placed by customers will appear here.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-xs text-muted uppercase tracking-widest font-bold">
                                    <th className="px-4 py-2 font-medium">Order ID</th>
                                    <th className="px-4 py-2 font-medium">Table</th>
                                    <th className="px-4 py-2 font-medium">Total</th>
                                    <th className="px-4 py-2 font-medium">Status / Action</th>
                                    <th className="px-4 py-2 font-medium text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {orders.map((order, idx) => {
                                        const config = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
                                        const StatusIcon = config.icon;

                                        return (
                                            <motion.tr
                                                key={order._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-elevated hover:bg-elevated/80 border border-border rounded-2xl overflow-hidden group transition-all"
                                            >
                                                <td className="px-4 py-4 rounded-l-2xl border-l border-t border-b border-border">
                                                    <span className="font-mono text-xs font-bold text-muted-foreground bg-surface px-2 py-1 rounded border border-border">
                                                        #{order._id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <div className="text-[10px] text-muted mt-1 font-mono">
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 border-t border-b border-border">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-gold text-sm shadow-inner tracking-tight">
                                                            {order.tableNumber}
                                                        </div>
                                                        <span className="text-xs text-muted font-medium">T-{order.tableNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 border-t border-b border-border">
                                                    <span className="font-mono font-bold text-gold">₹{order.totalAmount}</span>
                                                </td>
                                                <td className="px-4 py-4 border-t border-b border-border">
                                                    <div className="flex items-center gap-3">
                                                        <span className={clsx(
                                                            "px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-widest flex items-center gap-2",
                                                            config.bg, config.color, config.border
                                                        )}>
                                                            <StatusIcon size={14} className={order.status === 'Preparing' ? 'animate-pulse' : ''} />
                                                            {order.status}
                                                        </span>

                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                            className="text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-foreground-pale outline-none focus:border-primary/50 cursor-pointer hidden md:block"
                                                        >
                                                            {Object.keys(STATUS_CONFIG).map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 rounded-r-2xl border-r border-t border-b border-border text-right">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border rounded-xl text-muted hover:text-primary transition-all inline-flex shadow-sm"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        )
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?._id.slice(-6).toUpperCase()}`}>
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start bg-elevated p-4 rounded-xl border border-border">
                            <div>
                                <h3 className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Table</h3>
                                <p className="text-2xl font-display font-bold text-gold">T-{selectedOrder.tableNumber}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Total</h3>
                                <p className="text-2xl font-mono font-bold text-foreground-pale">₹{selectedOrder.totalAmount}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-foreground-pale uppercase tracking-wide mb-3">Order Items</h4>
                            <div className="space-y-2">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-elevated border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 text-center font-bold text-primary font-mono">{item.quantity}x</div>
                                            <span className="font-medium text-foreground-pale text-sm">{item.name || 'Menu Item'}</span>
                                        </div>
                                        <div className="font-mono text-sm text-gold">₹{item.price * item.quantity}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <label className="block text-xs text-muted uppercase tracking-widest font-bold mb-2">Update Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(STATUS_CONFIG).slice(0, 4).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(selectedOrder._id, status)}
                                            className={clsx(
                                                "px-3 py-1.5 rounded border text-[10px] font-bold uppercase tracking-widest transition-all",
                                                selectedOrder.status === status
                                                    ? `${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color} ${STATUS_CONFIG[status].border}`
                                                    : "bg-surface border-border text-muted hover:border-primary/30"
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleDownloadBill(selectedOrder._id)}
                                disabled={isDownloadingBill}
                                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isDownloadingBill ? (
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                Download PDF Bill
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminOrders;
