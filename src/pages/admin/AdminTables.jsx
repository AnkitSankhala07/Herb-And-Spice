import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { QrCode, Download, Users, Plus, Maximize, Clock, Trash2, Loader2, Save, X, Printer, FileDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Button } from '../../components/ui/Button';
import { getTables, addTable, deleteTable, updateTable, getTableQR, getAllTableQRs, downloadQRPdf } from '../../services/api';
import toast from 'react-hot-toast';

const AdminTables = () => {
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTable, setNewTable] = useState({ tableId: '', capacity: 4 });

    // QR State
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [showFullscreenQR, setShowFullscreenQR] = useState(false);
    const [qrThumbnails, setQrThumbnails] = useState({});

    const fetchTables = async () => {
        try {
            const data = await getTables();
            setTables(data);
            setIsLoading(false);
        } catch (error) {
            toast.error("Failed to load tables");
            setIsLoading(false);
        }
    };

    // Load QR thumbnails for all tables
    const loadQRThumbnails = useCallback(async () => {
        try {
            const allQRs = await getAllTableQRs();
            const thumbMap = {};
            allQRs.forEach(qr => {
                thumbMap[qr.tableId] = qr.qrImage;
            });
            setQrThumbnails(thumbMap);
        } catch (error) {
            console.warn('Could not load QR thumbnails:', error);
        }
    }, []);

    useEffect(() => {
        fetchTables();
    }, []);

    // Load thumbnails after tables are loaded
    useEffect(() => {
        if (tables.length > 0) {
            loadQRThumbnails();
        }
    }, [tables, loadQRThumbnails]);

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            // Validate tableId is provided and is a number
            if (!newTable.tableId || newTable.tableId.toString().trim() === '') {
                toast.error('Table number is required');
                return;
            }
            if (isNaN(newTable.tableId)) {
                toast.error('Table number must be a valid number');
                return;
            }
            
            // Convert tableId to number for database
            const tableData = {
                tableId: parseInt(newTable.tableId, 10),
                capacity: parseInt(newTable.capacity, 10) || 4
            };
            
            await addTable(tableData);
            toast.success(`Table ${tableData.tableId} added successfully`);
            setShowAddModal(false);
            setNewTable({ tableId: '', capacity: 4 });
            fetchTables();
        } catch (error) {
            console.error('Error adding table:', error);
            if (error.response?.data?.message?.includes('duplicate')) {
                toast.error(`Table ${newTable.tableId} already exists`);
            } else {
                toast.error(error.response?.data?.message || 'Error adding table');
            }
        }
    };

    const handleDeleteTable = async (id) => {
        if (!window.confirm("Are you sure you want to remove this table?")) return;
        try {
            await deleteTable(id);
            toast.success("Table removed");
            setSelectedTable(null);
            fetchTables();
        } catch (error) {
            toast.error("Error removing table");
        }
    };

    // ── QR Code Handlers ──
    const handleShowQR = async (tableId, e) => {
        if (e) e.stopPropagation();
        setQrLoading(true);
        setShowQRModal(true);
        try {
            const data = await getTableQR(tableId);
            setQrData(data);
        } catch (error) {
            toast.error('Failed to generate QR code');
            setShowQRModal(false);
        } finally {
            setQrLoading(false);
        }
    };

    const handleDownloadQRImage = () => {
        if (!qrData) return;
        const link = document.createElement('a');
        link.download = `AKXTON_Table_${qrData.tableId}_QR.png`;
        link.href = qrData.qrImage;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`QR code for Table ${qrData.tableId} downloaded!`);
    };

    const handlePrintQR = () => {
        if (!qrData) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>AKXTON — Table ${qrData.tableId} QR Code</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        display: flex; align-items: center; justify-content: center; 
                        min-height: 100vh; background: #fff; font-family: 'Helvetica Neue', sans-serif;
                    }
                    .card {
                        text-align: center; padding: 48px 40px; border: 2px solid #E0D5C0;
                        border-radius: 20px; background: #FAFAF5;
                    }
                    .brand { font-size: 24px; font-weight: 800; color: #1C2B1A; letter-spacing: -0.5px; margin-bottom: 4px; }
                    .subtitle { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 24px; }
                    img { width: 280px; height: 280px; border-radius: 12px; }
                    .table-label { font-size: 22px; font-weight: 800; color: #1C2B1A; margin-top: 20px; }
                    .scan-text { font-size: 11px; color: #888; margin-top: 6px; }
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="brand">AKXTON</div>
                    <div class="subtitle">Digital Menu</div>
                    <img src="${qrData.qrImage}" alt="QR Code" />
                    <div class="table-label">Table ${qrData.tableId}</div>
                    <div class="scan-text">Scan to view our menu & place your order</div>
                </div>
                <script>window.onload = () => { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadAllPDF = () => {
        const url = downloadQRPdf();
        window.open(url, '_blank');
        toast.success('Downloading QR codes PDF...');
    };

    return (
        <div className="text-foreground max-w-full">
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground-pale mb-1 tracking-tight">Table Manager</h1>
                    <p className="text-muted text-sm tracking-wide">Manage persistent table assignments, sessions, and QR codes.</p>
                </div>
                <div className="flex gap-2 self-start">
                    {/* Download All QR Codes as PDF */}
                    <button 
                        onClick={handleDownloadAllPDF}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-surface border border-border text-foreground-pale hover:bg-elevated transition-all hover:scale-105 shadow-sm"
                    >
                        <FileDown size={16} />
                        Download All QRs
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-background shadow-[0_4px_15px_-3px_rgba(139,94,60,0.4)] transition-all hover:scale-105"
                    >
                        <Plus size={16} />
                        Add New Table
                    </button>
                </div>
            </div>

            <Card className="bg-surface border-border p-6 shadow-xl relative min-h-[500px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : (
                    <>
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6 relative z-10 p-2">
                            <AnimatePresence>
                                {tables.map((table, idx) => (
                                    <motion.div
                                        key={table._id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedTable(table)}
                                        className={clsx(
                                            "aspect-square p-4 rounded-2xl border-2 flex flex-col justify-between items-center cursor-pointer hover:scale-105 transition-all w-full shadow-lg group relative overflow-hidden",
                                            table.status === 'occupied'
                                                ? "bg-primary/5 border-primary shadow-primary/20 hover:bg-primary/10"
                                                : "bg-surface border-border hover:border-muted shadow-transparent"
                                        )}
                                    >
                                        {/* Capacity badge */}
                                        <div className="absolute top-2 right-2 text-xs flex gap-1">
                                            <span className="flex items-center justify-center bg-elevated border border-border min-w-[20px] h-[20px] rounded-full text-[10px] font-bold text-muted">
                                                <Users size={10} className="mr-0.5" />
                                                {table.capacity}
                                            </span>
                                        </div>

                                        {/* QR Thumbnail */}
                                        <div className="absolute top-2 left-2">
                                            {qrThumbnails[table.tableId] ? (
                                                <button
                                                    onClick={(e) => handleShowQR(table.tableId, e)}
                                                    className="w-[28px] h-[28px] rounded-md overflow-hidden border border-border hover:border-primary/50 transition-all hover:scale-110 shadow-sm bg-white"
                                                    title={`View QR for Table ${table.tableId}`}
                                                >
                                                    <img 
                                                        src={qrThumbnails[table.tableId]} 
                                                        alt={`QR T${table.tableId}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleShowQR(table.tableId, e)}
                                                    className="w-[28px] h-[28px] rounded-md flex items-center justify-center border border-border hover:border-primary/50 transition-all hover:scale-110 bg-elevated"
                                                    title={`Generate QR for Table ${table.tableId}`}
                                                >
                                                    <QrCode size={14} className="text-muted" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Table number */}
                                        <div className={clsx(
                                            "text-3xl sm:text-4xl font-display font-bold mt-4 tracking-tighter transition-colors",
                                            table.status === 'occupied' ? "text-primary" : "text-muted group-hover:text-foreground-pale"
                                        )}>
                                            T{table.tableId}
                                        </div>

                                        {/* Status */}
                                        <div className="text-[10px] mt-2 uppercase tracking-widest font-bold">
                                            {table.status === 'occupied' ? (
                                                <span className="text-gold flex flex-col items-center gap-1 text-[11px] font-mono">
                                                    ₹{table.currentBill || 0}
                                                </span>
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
                    </>
                )}
            </Card>

            {/* ── Modal: Manage Existing Table ── */}
            <Modal isOpen={!!selectedTable} onClose={() => setSelectedTable(null)} title={`Manage Table ${selectedTable?.tableId}`}>
                {selectedTable && (
                    <div className="space-y-6 pb-2">
                        {selectedTable.status === 'occupied' && selectedTable.sessionStart && (
                            <div className="flex justify-between items-stretch gap-4">
                                <div className="flex-1 bg-elevated p-4 rounded-xl border border-border flex flex-col justify-center">
                                    <h3 className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Session Active For</h3>
                                    <p className="text-lg font-mono font-bold text-teal flex items-center gap-2">
                                        <Clock size={16} />
                                        {Math.floor((new Date() - new Date(selectedTable.sessionStart)) / 60000)} mins
                                    </p>
                                </div>
                                <div className="flex-1 bg-elevated p-4 rounded-xl border border-border flex flex-col justify-center text-right">
                                    <h3 className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Current Bill</h3>
                                    <p className="text-2xl font-mono font-bold text-gold shrink-0">₹{selectedTable.currentBill || 0}</p>
                                </div>
                            </div>
                        )}

                        {/* QR Code Section */}
                        <div className="border border-border bg-surface rounded-xl p-6 text-center shadow-inner relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* QR Preview Container */}
                            <div className="w-56 h-56 mx-auto bg-[#FAFAF5] p-4 rounded-2xl shadow-lg border-2 border-[#E0D5C0] flex flex-col items-center justify-center relative">
                                {qrThumbnails[selectedTable.tableId] ? (
                                    <img 
                                        src={qrThumbnails[selectedTable.tableId]} 
                                        alt={`QR Code for Table ${selectedTable.tableId}`}
                                        className="w-44 h-44 rounded-lg"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <QrCode size={80} className="text-black/20" />
                                        <span className="text-xs text-black/40 font-medium">Click below to generate</span>
                                    </div>
                                )}
                            </div>

                            <h4 className="text-sm font-bold text-foreground-pale uppercase tracking-wide mt-5 mb-1">Table {selectedTable.tableId} — QR Code</h4>
                            <p className="text-xs text-muted max-w-sm mx-auto mb-5">Customers can scan this to access the digital menu directly.</p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
                                <Button 
                                    onClick={() => handleShowQR(selectedTable.tableId)} 
                                    className="bg-primary hover:bg-primary/90 text-background flex items-center gap-2 justify-center font-bold"
                                >
                                    <QrCode size={16} /> View & Download QR
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setShowFullscreenQR(true);
                                        handleShowQR(selectedTable.tableId);
                                    }}
                                    className="bg-transparent border border-border text-muted hover:text-foreground-pale hover:bg-elevated flex items-center gap-2 justify-center font-bold"
                                >
                                    <Maximize size={16} /> Fullscreen
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                             <Button 
                                onClick={() => handleDeleteTable(selectedTable._id)} 
                                className="w-full bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 font-bold flex items-center gap-2 justify-center transition-all"
                            >
                                <Trash2 size={16} /> Remove Table
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Modal: QR Code View ── */}
            <Modal isOpen={showQRModal} onClose={() => { setShowQRModal(false); setQrData(null); }} title="QR Code">
                {qrLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-sm text-muted font-medium animate-pulse">Generating QR Code...</p>
                        </div>
                    </div>
                ) : qrData ? (
                    <div className="space-y-6">
                        {/* Premium QR Card */}
                        <div className="bg-gradient-to-b from-[#FAFAF5] to-[#F0E8D5] rounded-2xl p-8 border-2 border-[#E0D5C0] shadow-xl">
                            {/* Brand Header */}
                            <div className="text-center mb-5">
                                <h2 className="text-2xl font-display font-extrabold text-[#1C2B1A] tracking-tight">AKXTON</h2>
                                <p className="text-[10px] uppercase tracking-[4px] text-[#999] font-bold mt-0.5">Digital Menu</p>
                            </div>

                            {/* QR Code Image */}
                            <div className="flex justify-center">
                                <div className="bg-white p-3 rounded-xl shadow-md border border-[#E0D5C0]">
                                    <img 
                                        src={qrData.qrImage} 
                                        alt={`QR Code for Table ${qrData.tableId}`}
                                        className="w-[280px] h-[280px] rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Table Label */}
                            <div className="text-center mt-5">
                                <h3 className="text-xl font-display font-extrabold text-[#1C2B1A]">Table {qrData.tableId}</h3>
                                <p className="text-xs text-[#888] mt-1">Scan to view our menu & place your order</p>
                            </div>
                        </div>

                        {/* URL Preview */}
                        <div className="bg-elevated rounded-xl p-3 border border-border flex items-center gap-3">
                            <ExternalLink size={14} className="text-muted shrink-0" />
                            <span className="text-xs text-muted font-mono truncate flex-1">{qrData.url}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <Button 
                                onClick={handleDownloadQRImage}
                                className="bg-primary hover:bg-primary/90 text-background flex items-center gap-2 justify-center font-bold text-sm py-3"
                            >
                                <Download size={15} /> PNG
                            </Button>
                            <Button 
                                onClick={handlePrintQR}
                                className="bg-surface hover:bg-elevated border border-border text-foreground-pale flex items-center gap-2 justify-center font-bold text-sm py-3"
                            >
                                <Printer size={15} /> Print
                            </Button>
                            <Button 
                                onClick={() => {
                                    setShowQRModal(false);
                                    setShowFullscreenQR(true);
                                }}
                                className="bg-surface hover:bg-elevated border border-border text-foreground-pale flex items-center gap-2 justify-center font-bold text-sm py-3"
                            >
                                <Maximize size={15} /> Full
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* ── Fullscreen QR Overlay ── */}
            <AnimatePresence>
                {showFullscreenQR && qrData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-[#FAFAF5] flex flex-col items-center justify-center"
                        onClick={() => setShowFullscreenQR(false)}
                    >
                        {/* Close button */}
                        <button 
                            onClick={() => setShowFullscreenQR(false)}
                            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-[#1C2B1A]/10 hover:bg-[#1C2B1A]/20 flex items-center justify-center transition-all"
                        >
                            <X size={24} className="text-[#1C2B1A]" />
                        </button>

                        {/* Brand */}
                        <motion.h1 
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl font-display font-extrabold text-[#1C2B1A] tracking-tight mb-1"
                        >
                            AKXTON
                        </motion.h1>
                        <motion.p
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm uppercase tracking-[6px] text-[#999] font-bold mb-8"
                        >
                            Digital Menu
                        </motion.p>

                        {/* Large QR */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                            className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-[#E0D5C0]"
                        >
                            <img 
                                src={qrData.qrImage} 
                                alt={`QR Code for Table ${qrData.tableId}`}
                                className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-xl"
                            />
                        </motion.div>

                        {/* Table Label */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-center mt-8"
                        >
                            <h2 className="text-3xl font-display font-extrabold text-[#1C2B1A]">Table {qrData.tableId}</h2>
                            <p className="text-sm text-[#888] mt-2">Scan to view menu & place your order</p>
                        </motion.div>

                        {/* Tap to close hint */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="absolute bottom-8 text-xs text-[#BBB] uppercase tracking-widest"
                        >
                            Tap anywhere to close
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modal: Add New Table ── */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Table">
                <form onSubmit={handleAddTable} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-muted uppercase tracking-widest mb-2 block">Table Name / ID</label>
                        <input 
                            type="text"
                            required
                            placeholder="e.g. 15, B1, Terrace-2"
                            value={newTable.tableId}
                            onChange={(e) => setNewTable({...newTable, tableId: e.target.value})}
                            className="w-full bg-elevated border border-border rounded-xl p-4 text-foreground-pale focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted uppercase tracking-widest mb-2 block">Seating Capacity</label>
                        <input 
                            type="number"
                            required
                            min="1"
                            value={newTable.capacity}
                            onChange={(e) => setNewTable({...newTable, capacity: parseInt(e.target.value)})}
                            className="w-full bg-elevated border border-border rounded-xl p-4 text-foreground-pale focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-background font-bold h-14 rounded-xl mt-4 flex items-center justify-center gap-2">
                        <Save size={18} /> Save Table
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminTables;
