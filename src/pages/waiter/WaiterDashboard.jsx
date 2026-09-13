import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { QrCode, ClipboardList, Users, Maximize, Clock, Trash2, CheckCircle, Loader2, Bell, Download } from 'lucide-react';
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
                
                // If no active orders, ensure table reflects available status
                if (!summary) {
                    return {
                        ...table,
                        status: table.status,  // Keep backend status (should be 'available' after mark-paid)
                        currentBill: 0,  // No bill if no orders
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
            // Sync selectedTable with fresh data so the modal updates too
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

        // Real-time table updates
        socket.on('table_update', () => {
            fetchTables();
        });

        socket.on('new_order', () => {
            fetchTables();
        });

        // When any order status changes, refresh tables to reflect new state
        socket.on('order_status_update', (updatedOrder) => {
            fetchTables();
            toast(`Order for Table ${updatedOrder.tableNumber}: ${updatedOrder.status}`, {
                icon: updatedOrder.status === 'Ready' ? '✅' : updatedOrder.status === 'Paid' ? '💰' : '📋',
                duration: 3000,
                style: {
                    background: '#243023',
                    color: '#F0E8D5',
                    border: '1px solid #344530',
                },
            });
        });

        socket.on('waiter_called', (data) => {
            // Ensure tableId is normalized as number for consistent comparison
            const calledTableId = parseInt(data.tableId, 10);
            console.log('🔔 Waiter called for table:', calledTableId);
            
            setCallingTables(prev => {
                // Check if table is already in calling list
                const exists = prev.some(id => parseInt(id, 10) === calledTableId);
                if (!exists) {
                    return [...prev, calledTableId];
                }
                return prev;
            });
            
            toast(`🔔 Table ${calledTableId} requires assistance!`, {
                icon: '📞',
                duration: 6000,
                style: {
                    background: '#243023',
                    color: '#C8973F',
                    border: '1px solid #C8973F',
                },
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
            // Call API to mark as paid and clear table
            const result = await markTablePaidApi(table.tableId);
            const orderCount = result.updatedOrders?.length || 0;
            toast.success(
                orderCount > 0
                    ? `${orderCount} order(s) marked as Paid — Table ${table.tableId} cleared!`
                    : `Table ${table.tableId} cleared!`
            );
            
            // Fetch fresh data from backend
            const updatedTables = await fetchTables();
            console.log('✅ Fresh tables fetched after mark-paid:', updatedTables);
            
            // Find the cleared table in fresh data
            const clearedTable = updatedTables?.find(t => t.tableId === table.tableId);
            
            if (clearedTable) {
                console.log('✅ Cleared table found:', {
                    tableId: clearedTable.tableId,
                    status: clearedTable.status,
                    bill: clearedTable.currentBill,
                    orders: clearedTable.activeOrderCount
                });
                // Immediately show the cleared state in modal
                setSelectedTable(clearedTable);
            } else {
                console.warn('⚠️ Could not find cleared table in response');
            }
            
            // Emit socket to notify ALL other screens (kitchen, customer, admin)
            socket.emit('table_update_from_waiter');
            
            // Keep modal open for 2s so user sees the cleared state clearly
            setTimeout(() => setSelectedTable(null), 2000);
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
            toast.success(`New session started for Table ${tableId}`);
            
            // Refresh tables to show updated status
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
        <div className="text-foreground max-w-full">
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground-pale mb-1 tracking-tight">Floor Plan</h1>
                    <p className="text-muted text-sm tracking-wide">Monitor active tables and take orders directly.</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => {
                            setCallingTables([]);
                            fetchTables();
                            toast.success('Floor plan refreshed');
                        }}
                        className="bg-muted/10 hover:bg-muted/20 text-muted border border-muted/30 font-bold flex items-center gap-2"
                    >
                        🔄 Refresh
                    </Button>
                </div>
            </div>

            <Card className="bg-surface border-border p-6 shadow-xl relative min-h-[500px]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 relative z-10 p-2 border border-border/50 rounded-2xl bg-elevated/20">
                        <AnimatePresence>
                            {tables.map((table, idx) => (
                                <motion.div
                                    key={table._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleTableClick(table)}
                                    className={clsx(
                                        "aspect-square p-4 rounded-2xl border-2 flex flex-col justify-between items-center cursor-pointer hover:scale-105 transition-all w-full shadow-lg group relative overflow-hidden",
                                        callingTables.includes(table.tableId)
                                            ? "bg-amber/10 border-amber shadow-amber/40 animate-pulse ring-2 ring-amber/50"
                                            : table.status === 'occupied'
                                                ? "bg-primary/10 border-primary shadow-primary/20"
                                                : "bg-surface border-border hover:border-muted shadow-transparent"
                                    )}
                                >
                                    <div className="absolute top-2 right-2 text-xs flex gap-1">
                                        <span className="flex items-center justify-center bg-elevated border border-border min-w-[20px] h-[20px] rounded-full text-[10px] font-bold text-muted">
                                            <Users size={10} className="mr-0.5" />
                                            {table.capacity}
                                        </span>
                                    </div>
                                    {callingTables.includes(table.tableId) && (
                                        <div className="absolute top-2 left-2 text-amber animate-bounce bg-elevated rounded-full p-1 border border-amber/30">
                                            <Bell size={14} />
                                        </div>
                                    )}
                                    <div className={clsx(
                                        "text-3xl sm:text-4xl font-display font-bold mt-4 tracking-tighter transition-colors",
                                        table.status === 'occupied' ? "text-primary" : "text-muted group-hover:text-foreground-pale"
                                    )}>
                                        T{table.tableId}
                                    </div>
                                    <div className="text-[10px] mt-2 uppercase tracking-widest font-bold">
                                        {table.status === 'occupied' ? (
                                            <div className="text-gold flex flex-col items-center gap-1 text-[11px] font-mono">
                                                <span>₹{table.currentBill || 0}</span>
                                                <span className="text-[9px] uppercase tracking-wider text-muted">
                                                    {table.activeOrderCount || 1} {(table.activeOrderCount || 1) > 1 ? 'orders' : 'order'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted">Available</span>
                                        )}
                                    </div>
                                    {table.status === 'occupied' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-gold opacity-80" />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </Card>

            <Modal isOpen={!!selectedTable} onClose={() => setSelectedTable(null)} title={`T-${selectedTable?.tableId} Quick Action`}>
                {selectedTable && (
                    <div className="space-y-6 pb-2">
                        {selectedTable.status === 'occupied' ? (
                            <>
                                <div className="flex justify-between items-stretch gap-4">
                                    <div className="flex-1 bg-elevated p-4 rounded-xl border border-border flex flex-col justify-center">
                                        <h3 className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Session Active For</h3>
                                        <p className="text-lg font-mono font-bold text-teal flex items-center gap-2">
                                            <Clock size={16} />
                                            {selectedTable.sessionStart ? Math.floor((new Date() - new Date(selectedTable.sessionStart)) / 60000) : 0} mins
                                        </p>
                                    </div>
                                    <div className="flex-1 bg-elevated p-4 rounded-xl border border-border flex flex-col justify-center text-right">
                                        <h3 className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Current Bill</h3>
                                        <p className="text-2xl font-mono font-bold text-gold shrink-0">₹{selectedTable.currentBill || 0}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-border flex-wrap">
                                    <Button onClick={() => alert('Order Module coming soon.')} className="flex-1 min-w-[120px] bg-primary hover:bg-primary/90 text-background font-bold flex items-center justify-center gap-2">
                                        <ClipboardList size={18} /> Take Order
                                    </Button>
                                    <Button 
                                        onClick={() => handleGenerateBill(selectedTable.tableId)} 
                                        disabled={isGeneratingBill || !selectedTable.currentBill}
                                        className="flex-1 min-w-[120px] bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isGeneratingBill ? <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" /> : <Download size={18} />}
                                        Generate Bill
                                    </Button>
                                    <Button onClick={() => handleMarkPaid(selectedTable)} className="flex-1 min-w-[120px] bg-teal/10 hover:bg-teal/20 text-teal border border-teal/20 font-bold flex items-center justify-center gap-2">
                                        <CheckCircle size={18} /> Mark as Paid
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <QrCode size={48} className="mx-auto text-muted mb-4 opacity-50" />
                                <h4 className="text-sm font-bold text-foreground-pale uppercase tracking-wide mb-2">Table is empty</h4>
                                <p className="text-xs text-muted max-w-sm mx-auto mb-6">Seat customers and begin a new session.</p>
                                <Button 
                                    onClick={() => handleStartSession(selectedTable._id)} 
                                    className="w-full bg-primary hover:bg-primary/90 text-background font-bold flex items-center justify-center gap-2"
                                >
                                    <Users size={18} /> Start New Session
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
