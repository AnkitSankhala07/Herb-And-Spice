import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { QrCode, ClipboardList, Users, Maximize, Clock, Trash2, CheckCircle, Loader2, Bell, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Button } from '../../components/ui/Button';
import { getTables, getKitchenOrders, updateTable, markTablePaid as markTablePaidApi, api, socket } from '../../services/api';
import toast from 'react-hot-toast';

const WaiterDashboard = () => {
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
    const [callingTables, setCallingTables] = useState([]);
    const [isGeneratingBill, setIsGeneratingBill] = useState(false);

    const fetchTables = async () => {
        try {
            const [tableData, activeOrders] = await Promise.all([
                getTables(),
                getKitchenOrders(),
            ]);

            const ordersByTable = activeOrders.reduce((acc, order) => {
                const key = Number(order.tableNumber);
                if (!acc[key]) {
                    acc[key] = { total: 0, count: 0 };
                }
                acc[key].total += Number(order.totalAmount || 0);
                acc[key].count += 1;
                return acc;
            }, {});

            const data = tableData.map((table) => {
                const key = Number(table.tableId);
                const summary = ordersByTable[key];
                
                if (!summary) {
                    return {
                        ...table,
                        status: table.status,
                        currentBill: 0,
                        activeOrderCount: 0,
                    };
                }

                return {
                    ...table,
                    status: 'occupied',
                    currentBill: Number(summary.total.toFixed(2)),
                    activeOrderCount: summary.count,
                };
            });

            setTables(data);
            setSelectedTable(prev => {
                if (prev) {
                    const updated = data.find(t => t._id === prev._id);
                    return updated || null;
                }
                return null;
            });
            setIsLoading(false);
            return data;
        } catch (error) {
            console.error("Failed to fetch tables", error);
            setIsLoading(false);
            return [];
        }
    };

    useEffect(() => {
        fetchTables();

        socket.on('table_update', () => {
            fetchTables();
        });

        socket.on('new_order', () => {
            fetchTables();
        });

        socket.on('order_status_update', (updatedOrder) => {
            fetchTables();
            toast(`Table ${updatedOrder.tableNumber}: ${updatedOrder.status}`, {
                icon: updatedOrder.status === 'Ready' ? '✅' : updatedOrder.status === 'Paid' ? '💰' : '📋',
                duration: 3000,
            });
        });

        socket.on('waiter_called', (data) => {
            const calledTableId = parseInt(data.tableId, 10);
            
            setCallingTables(prev => {
                const exists = prev.some(id => parseInt(id, 10) === calledTableId);
                if (!exists) {
                    return [...prev, calledTableId];
                }
                return prev;
            });
            
            toast(`🔔 Table ${calledTableId} requests waiter assistance!`, {
                icon: '📞',
                duration: 6000,
            });
        });

        return () => {
            socket.off('table_update');
            socket.off('new_order');
            socket.off('order_status_update');
            socket.off('waiter_called');
        };
    }, []);

    const handleMarkPaid = async (table) => {
        try {
            const result = await markTablePaidApi(table.tableId);
            const orderCount = result.updatedOrders?.length || 0;
            toast.success(
                orderCount > 0
                    ? `${orderCount} order(s) marked Paid — Table ${table.tableId} cleared!`
                    : `Table ${table.tableId} cleared!`
            );
            
            const updatedTables = await fetchTables();
            const clearedTable = updatedTables?.find(t => t.tableId === table.tableId);
            
            if (clearedTable) {
                setSelectedTable(clearedTable);
            }
            
            socket.emit('table_update_from_waiter');
            setTimeout(() => setSelectedTable(null), 1800);
        } catch (error) {
            console.error('Failed to mark paid:', error);
            toast.error("Failed to mark as paid");
        }
    };

    const handleClearTable = async (tableId) => {
        try {
            await updateTable(tableId, { status: 'available', currentBill: 0, sessionStart: null });
            toast.success("Table cleared");
            setSelectedTable(null);
            socket.emit('table_update_from_waiter');
            fetchTables();
        } catch (error) {
            toast.error("Failed to clear table");
        }
    };

    const handleStartSession = async (tableId) => {
        try {
            const sessionStart = new Date();
            await updateTable(tableId, { status: 'occupied', sessionStart });
            toast.success(`Session opened for Table ${tableId}`);
            
            const updatedTables = await fetchTables();
            const updatedTable = updatedTables?.find(t => t.tableId === tableId);
            if (updatedTable) {
                setSelectedTable(updatedTable);
            }
            
            socket.emit('table_update_from_waiter');
        } catch (error) {
            console.error('Failed to start session:', error);
            toast.error("Failed to start session");
        }
    };

    const handleTableClick = (table) => {
        setSelectedTable(table);
        if (callingTables.includes(table.tableId)) {
            setCallingTables(prev => prev.filter(id => id !== table.tableId));
        }
    };

    const handleGenerateBill = async (tableId) => {
        setIsGeneratingBill(true);
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
            toast.success(`Bill generated for Table ${tableId}`);
        } catch (error) {
            console.error('Failed to generate bill:', error);
            toast.error(error?.response?.data?.message || 'Failed to generate table bill');
        } finally {
            setIsGeneratingBill(false);
        }
    };

    return (
        <div className="text-[#222222] max-w-full">
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Floor Operations</h1>
                    <p className="text-[#818181] text-xs mt-1">Live table seating, service alerts, and checkout settlements.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            setCallingTables([]);
                            fetchTables();
                            toast.success('Floor updated');
                        }}
                        className="bg-white hover:bg-[#F8F8F8] text-[#222222] border border-[#EBEBEB] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                    >
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            <Card className="bg-white border border-[#EBEBEB] p-6 shadow-[0_4px_24px_rgba(90,114,74,0.06)] relative min-h-[500px] rounded-3xl">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-[#5A724A]" size={36} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 relative z-10 p-1">
                        <AnimatePresence>
                            {tables.map((table, idx) => {
                                const isCalling = callingTables.includes(table.tableId);
                                const isOccupied = table.status === 'occupied';

                                return (
                                    <motion.div
                                        key={table._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => handleTableClick(table)}
                                        className={clsx(
                                            "aspect-square p-4 rounded-3xl border-2 flex flex-col justify-between items-center cursor-pointer hover:scale-103 transition-all w-full group relative overflow-hidden",
                                            isCalling
                                                ? "bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-300 animate-pulse"
                                                : isOccupied
                                                    ? "bg-[#BCE2A3]/20 border-[#5A724A] shadow-[0_4px_16px_rgba(90,114,74,0.12)]"
                                                    : "bg-[#F8F8F8] border-[#EBEBEB] hover:border-[#BCE2A3] hover:bg-white"
                                        )}
                                    >
                                        <div className="absolute top-2.5 right-2.5 text-xs flex gap-1">
                                            <span className="flex items-center justify-center bg-white border border-[#EBEBEB] px-2 h-5 rounded-full text-[10px] font-bold text-[#818181]">
                                                <Users size={10} className="mr-0.5" />
                                                {table.capacity}
                                            </span>
                                        </div>

                                        {isCalling && (
                                            <div className="absolute top-2.5 left-2.5 text-amber-700 bg-white rounded-full p-1 border border-amber-300 animate-bounce">
                                                <Bell size={12} />
                                            </div>
                                        )}

                                        <div className={clsx(
                                            "text-3xl font-extrabold mt-4 tracking-tight transition-colors",
                                            isOccupied ? "text-[#5A724A]" : "text-[#222222]"
                                        )}>
                                            T{table.tableId}
                                        </div>

                                        <div className="text-[10px] mt-1 uppercase tracking-wider font-bold">
                                            {isOccupied ? (
                                                <div className="text-[#5A724A] flex flex-col items-center gap-0.5 text-xs font-mono">
                                                    <span>₹{table.currentBill || 0}</span>
                                                    <span className="text-[9px] uppercase tracking-wider text-[#818181] font-sans font-semibold">
                                                        {table.activeOrderCount || 1} {(table.activeOrderCount || 1) > 1 ? 'orders' : 'order'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[#818181]">Available</span>
                                            )}
                                        </div>

                                        {isOccupied && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#5A724A]" />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </Card>

            {/* Quick Action Modal */}
            <Modal isOpen={!!selectedTable} onClose={() => setSelectedTable(null)} title={`Table ${selectedTable?.tableId} Floor Action`}>
                {selectedTable && (
                    <div className="space-y-5 pb-1">
                        {selectedTable.status === 'occupied' ? (
                            <>
                                <div className="flex justify-between items-stretch gap-3">
                                    <div className="flex-1 bg-[#F8F8F8] p-3.5 rounded-2xl border border-[#EBEBEB] flex flex-col justify-center">
                                        <h3 className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-0.5">Session Active</h3>
                                        <p className="text-base font-mono font-bold text-[#5A724A] flex items-center gap-1.5">
                                            <Clock size={15} />
                                            {selectedTable.sessionStart ? Math.floor((new Date() - new Date(selectedTable.sessionStart)) / 60000) : 0} mins
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-[#F8F8F8] p-3.5 rounded-2xl border border-[#EBEBEB] flex flex-col justify-center text-right">
                                        <h3 className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-0.5">Total Tab</h3>
                                        <p className="text-xl font-mono font-extrabold text-[#222222]">₹{selectedTable.currentBill || 0}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 pt-4 border-t border-[#EBEBEB] flex-wrap">
                                    <Button 
                                        onClick={() => handleGenerateBill(selectedTable.tableId)} 
                                        disabled={isGeneratingBill || !selectedTable.currentBill}
                                        variant="outline"
                                        className="flex-1 min-w-[120px] py-2.5 text-xs font-bold rounded-full"
                                    >
                                        {isGeneratingBill ? <div className="w-3.5 h-3.5 border-2 border-[#5A724A] border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
                                        Print Bill
                                    </Button>
                                    <Button 
                                        onClick={() => handleMarkPaid(selectedTable)} 
                                        variant="primary"
                                        className="flex-1 min-w-[120px] py-2.5 text-xs font-bold rounded-full"
                                    >
                                        <CheckCircle size={14} /> Clear &amp; Mark Paid
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-[#BCE2A3]/30 rounded-full flex items-center justify-center text-[#5A724A] mx-auto mb-3">
                                    <Users size={28} />
                                </div>
                                <h4 className="text-sm font-bold text-[#222222] uppercase tracking-wider mb-1">Table Available</h4>
                                <p className="text-xs text-[#818181] max-w-xs mx-auto mb-5">Seat incoming guests to start a fresh ticket session.</p>
                                <Button 
                                    onClick={() => handleStartSession(selectedTable._id)} 
                                    variant="primary"
                                    className="w-full py-3 text-xs font-bold rounded-full"
                                >
                                    <Users size={16} /> Seat Guests &amp; Open Session
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default WaiterDashboard;
