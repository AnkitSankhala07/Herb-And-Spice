import { useState, useEffect } from 'react';
import { api, socket } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ChefHat, Package, IndianRupee, Eye, Download } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    'Pending': { color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
    'Preparing': { color: 'text-[#5A724A]', bg: 'bg-[#5A724A]/10', border: 'border-[#5A724A]/25', icon: ChefHat },
    'Ready': { color: 'text-[#425934]', bg: 'bg-[#BCE2A3]/30', border: 'border-[#BCE2A3]', icon: Package },
    'Served': { color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    'Paid': { color: 'text-[#2C3B24]', bg: 'bg-[#BCE2A3]/45', border: 'border-[#AEDB91]', icon: IndianRupee }
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
        <div className="text-[#222222] max-w-full">
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Active Orders</h1>
                    <p className="text-[#818181] text-xs mt-1">Live customer tickets and order statuses.</p>
                </div>
                <div className="flex bg-white p-1 rounded-full border border-[#EBEBEB] shadow-xs self-start">
                    <div className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-[#5A724A] text-white shadow-xs">
                        Active Tickets: {orders.filter(o => !['Paid', 'Served'].includes(o.status)).length}
                    </div>
                </div>
            </div>

            <Card className="bg-white border-[#EBEBEB] p-6 shadow-[0_4px_24px_rgba(90,114,74,0.06)] relative overflow-hidden min-h-[500px] rounded-3xl">
                <div className="overflow-x-auto relative z-10">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-8 h-8 border-4 border-[#BCE2A3] border-t-[#5A724A] rounded-full animate-spin" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20 text-[#818181]">
                            <Package size={44} className="mx-auto mb-3 opacity-30 text-[#5A724A]" />
                            <h3 className="text-base font-bold text-[#222222]">No Active Orders</h3>
                            <p className="text-xs mt-0.5">Customer orders will stream here in real time.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-y-2.5">
                            <thead>
                                <tr className="text-[11px] text-[#818181] uppercase tracking-wider font-bold">
                                    <th className="px-4 py-2 font-bold">Ticket ID</th>
                                    <th className="px-4 py-2 font-bold">Table</th>
                                    <th className="px-4 py-2 font-bold">Total</th>
                                    <th className="px-4 py-2 font-bold">Status / Update</th>
                                    <th className="px-4 py-2 font-bold text-right">Action</th>
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
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="bg-[#F8F8F8] hover:bg-[#F4F6F0] border border-[#EBEBEB] rounded-2xl overflow-hidden group transition-all"
                                            >
                                                <td className="px-4 py-3.5 rounded-l-2xl border-l border-t border-b border-[#EBEBEB]">
                                                    <span className="font-mono text-xs font-bold text-[#222222] bg-white px-2.5 py-1 rounded-full border border-[#EBEBEB]">
                                                        #{order._id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <div className="text-[10px] text-[#818181] mt-1 font-mono">
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 border-t border-b border-[#EBEBEB]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-white border border-[#BCE2A3] flex items-center justify-center font-bold text-[#5A724A] text-xs">
                                                            {order.tableNumber}
                                                        </div>
                                                        <span className="text-xs text-[#818181] font-semibold">T-{order.tableNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 border-t border-b border-[#EBEBEB]">
                                                    <span className="font-mono font-bold text-sm text-[#5A724A]">₹{order.totalAmount}</span>
                                                </td>
                                                <td className="px-4 py-3.5 border-t border-b border-[#EBEBEB]">
                                                    <div className="flex items-center gap-3">
                                                        <span className={clsx(
                                                            "px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                                            config.bg, config.color, config.border
                                                        )}>
                                                            <StatusIcon size={13} className={order.status === 'Preparing' ? 'animate-pulse' : ''} />
                                                            {order.status}
                                                        </span>

                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                            className="text-xs bg-white border border-[#EBEBEB] rounded-full px-3 py-1 text-[#222222] outline-none focus:border-[#5A724A] cursor-pointer hidden md:block"
                                                        >
                                                            {Object.keys(STATUS_CONFIG).map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 rounded-r-2xl border-r border-t border-b border-[#EBEBEB] text-right">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="w-8 h-8 rounded-full bg-white border border-[#EBEBEB] hover:border-[#5A724A] hover:text-[#5A724A] text-[#818181] transition-all inline-flex items-center justify-center shadow-xs"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {/* Order Details Modal */}
            <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?._id.slice(-6).toUpperCase()}`}>
                {selectedOrder && (
                    <div className="space-y-5">
                        <div className="flex justify-between items-start bg-[#F8F8F8] p-4 rounded-2xl border border-[#EBEBEB]">
                            <div>
                                <h3 className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-0.5">Table</h3>
                                <p className="text-2xl font-bold text-[#5A724A]">Table {selectedOrder.tableNumber}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-0.5">Total Amount</h3>
                                <p className="text-2xl font-mono font-extrabold text-[#222222]">₹{selectedOrder.totalAmount}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-[#818181] uppercase tracking-wider mb-2.5">Items in Order</h4>
                            <div className="space-y-2">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[#F8F8F8] border border-[#EBEBEB]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-6 text-center font-bold text-[#5A724A] font-mono text-xs">{item.quantity}x</div>
                                            <span className="font-semibold text-[#222222] text-xs">{item.name || 'Menu Item'}</span>
                                        </div>
                                        <div className="font-mono text-xs font-bold text-[#222222]">₹{item.price * item.quantity}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[#EBEBEB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <label className="block text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-1.5">Change Status</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.keys(STATUS_CONFIG).slice(0, 4).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(selectedOrder._id, status)}
                                            className={clsx(
                                                "px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all",
                                                selectedOrder.status === status
                                                    ? `${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color} ${STATUS_CONFIG[status].border}`
                                                    : "bg-white border-[#EBEBEB] text-[#818181] hover:text-[#222222]"
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
                                className="bg-[#5A724A] hover:bg-[#485D3B] text-white px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                            >
                                {isDownloadingBill ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Download size={14} />
                                )}
                                Download Receipt
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminOrders;
