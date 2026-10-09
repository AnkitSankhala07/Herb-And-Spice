import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { QrCode, Download, Users, Plus, Maximize, Clock, Trash2, Loader2, Save, X, Printer, FileDown, ExternalLink, Copy } from 'lucide-react';
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

    useEffect(() => {
        if (tables.length > 0) {
            loadQRThumbnails();
        }
    }, [tables, loadQRThumbnails]);

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            if (!newTable.tableId || newTable.tableId.toString().trim() === '') {
                toast.error('Table number is required');
                return;
            }
            if (isNaN(newTable.tableId)) {
                toast.error('Table number must be a valid number');
                return;
            }
            
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

    // QR Code Handlers
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
        link.download = `Herb_Spice_Table_${qrData.tableId}_QR.png`;
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
                <title>Herb &amp; Spice — Table ${qrData.tableId} QR</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        display: flex; align-items: center; justify-content: center; 
                        min-height: 100vh; background: #fff; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                    }
                    .card {
                        text-align: center; padding: 48px 40px; border: 2px solid #EBEBEB;
                        border-radius: 24px; background: #F8F8F8;
                    }
                    .brand { font-size: 26px; font-weight: 800; color: #222222; letter-spacing: -0.5px; margin-bottom: 4px; }
                    .subtitle { font-size: 11px; color: #5A724A; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; margin-bottom: 24px; }
                    img { width: 280px; height: 280px; border-radius: 16px; border: 1px solid #EBEBEB; }
                    .table-label { font-size: 24px; font-weight: 800; color: #222222; margin-top: 20px; }
                    .scan-text { font-size: 12px; color: #818181; margin-top: 6px; }
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="brand">Herb &amp; Spice 🌿</div>
                    <div class="subtitle">Artisan Digital Menu</div>
                    <img src="${qrData.qrImage}" alt="QR Code" />
                    <div class="table-label">Table ${qrData.tableId}</div>
                    <div class="scan-text">Scan with your smartphone to order</div>
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
        <div className="text-[#222222] max-w-full">
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Tables &amp; QR Codes</h1>
                    <p className="text-[#818181] text-xs mt-1">Manage dining tables and generate contactless QR codes.</p>
                </div>
                <div className="flex gap-2 self-start">
                    <button 
                        onClick={handleDownloadAllPDF}
                        className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-white border border-[#EBEBEB] text-[#222222] hover:bg-[#F8F8F8] transition-all shadow-xs"
                    >
                        <FileDown size={15} />
                        Download All QRs
                    </button>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-[#5A724A] text-white hover:bg-[#485D3B] transition-all shadow-xs"
                    >
                        <Plus size={15} />
                        Add New Table
                    </button>
                </div>
            </div>

            <Card className="bg-white border-[#EBEBEB] p-6 shadow-[0_4px_24px_rgba(90,114,74,0.06)] relative min-h-[500px] rounded-3xl">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-[#5A724A]" size={36} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7 gap-4 relative z-10 p-1">
                        <AnimatePresence>
                            {tables.map((table, idx) => (
                                <motion.div
                                    key={table._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => setSelectedTable(table)}
                                    className={clsx(
                                        "aspect-square p-4 rounded-3xl border-2 flex flex-col justify-between items-center cursor-pointer hover:scale-103 transition-all w-full group relative overflow-hidden",
                                        table.status === 'occupied'
                                            ? "bg-[#BCE2A3]/15 border-[#5A724A] shadow-[0_4px_20px_rgba(90,114,74,0.12)]"
                                            : "bg-[#F8F8F8] border-[#EBEBEB] hover:border-[#BCE2A3] hover:bg-white"
                                    )}
                                >
                                    {/* Capacity badge */}
                                    <div className="absolute top-2.5 right-2.5 text-xs flex gap-1">
                                        <span className="flex items-center justify-center bg-white border border-[#EBEBEB] px-2 h-5 rounded-full text-[10px] font-bold text-[#818181]">
                                            <Users size={10} className="mr-0.5" />
                                            {table.capacity}
                                        </span>
                                    </div>

                                    {/* QR Thumbnail */}
                                    <div className="absolute top-2.5 left-2.5">
                                        {qrThumbnails[table.tableId] ? (
                                            <button
                                                onClick={(e) => handleShowQR(table.tableId, e)}
                                                className="w-7 h-7 rounded-lg overflow-hidden border border-[#EBEBEB] hover:border-[#5A724A] transition-all hover:scale-110 shadow-2xs bg-white"
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
                                                className="w-7 h-7 rounded-lg flex items-center justify-center border border-[#EBEBEB] hover:border-[#5A724A] transition-all bg-white"
                                                title={`Generate QR for Table ${table.tableId}`}
                                            >
                                                <QrCode size={13} className="text-[#818181]" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Table number */}
                                    <div className={clsx(
                                        "text-3xl font-extrabold mt-4 tracking-tight transition-colors",
                                        table.status === 'occupied' ? "text-[#5A724A]" : "text-[#222222]"
                                    )}>
                                        T{table.tableId}
                                    </div>

                                    {/* Status */}
                                    <div className="text-[10px] mt-1 uppercase tracking-wider font-bold">
                                        {table.status === 'occupied' ? (
                                            <span className="text-[#5A724A] font-mono text-xs">
                                                ₹{table.currentBill || 0}
                                            </span>
                                        ) : (
                                            <span className="text-[#818181]">Available</span>
                                        )}
                                    </div>

                                    {table.status === 'occupied' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#5A724A]" />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </Card>

            {/* Modal: Manage Existing Table */}
            <Modal isOpen={!!selectedTable} onClose={() => setSelectedTable(null)} title={`Table ${selectedTable?.tableId} Settings`}>
                {selectedTable && (
                    <div className="space-y-5 pb-1">
                        {selectedTable.status === 'occupied' && selectedTable.sessionStart && (
                            <div className="flex justify-between items-stretch gap-3">
                                <div className="flex-1 bg-[#F8F8F8] p-3.5 rounded-2xl border border-[#EBEBEB] flex flex-col justify-center">
                                    <h3 className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-0.5">Session Time</h3>
                                    <p className="text-base font-mono font-bold text-[#5A724A] flex items-center gap-1.5">
                                        <Clock size={15} />
                                        {Math.floor((new Date() - new Date(selectedTable.sessionStart)) / 60000)} mins
                                    </p>
                                </div>
                                <div className="flex-1 bg-[#F8F8F8] p-3.5 rounded-2xl border border-[#EBEBEB] flex flex-col justify-center text-right">
                                    <h3 className="text-[10px] text-[#818181] uppercase tracking-wider font-bold mb-0.5">Tab Balance</h3>
                                    <p className="text-xl font-mono font-bold text-[#222222]">₹{selectedTable.currentBill || 0}</p>
                                </div>
                            </div>
                        )}

                        {/* QR Code Section */}
                        <div className="border border-[#EBEBEB] bg-[#F8F8F8] rounded-3xl p-5 text-center">
                            <div className="w-48 h-48 mx-auto bg-white p-3.5 rounded-2xl shadow-xs border border-[#EBEBEB] flex flex-col items-center justify-center">
                                {qrThumbnails[selectedTable.tableId] ? (
                                    <img 
                                        src={qrThumbnails[selectedTable.tableId]} 
                                        alt={`QR Code for Table ${selectedTable.tableId}`}
                                        className="w-40 h-40 rounded-lg"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <QrCode size={64} className="text-gray-300" />
                                        <span className="text-[11px] text-[#818181]">Generate code below</span>
                                    </div>
                                )}
                            </div>

                            <h4 className="text-xs font-bold text-[#222222] uppercase tracking-wider mt-4 mb-0.5">Table {selectedTable.tableId} QR Pass</h4>
                            <p className="text-xs text-[#818181] max-w-xs mx-auto mb-4">Guests scan this directly from their seats.</p>

                            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                                <Button 
                                    onClick={() => handleShowQR(selectedTable.tableId)} 
                                    variant="primary"
                                    className="py-2.5 text-xs font-bold rounded-full"
                                >
                                    <QrCode size={15} /> View QR
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setShowFullscreenQR(true);
                                        handleShowQR(selectedTable.tableId);
                                    }}
                                    className="py-2.5 text-xs font-bold rounded-full"
                                >
                                    <Maximize size={15} /> Fullscreen
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button 
                                onClick={() => handleDeleteTable(selectedTable._id)} 
                                variant="danger"
                                className="w-full py-2.5 text-xs rounded-full"
                            >
                                <Trash2 size={15} /> Remove Table
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: QR Code View */}
            <Modal isOpen={showQRModal} onClose={() => { setShowQRModal(false); setQrData(null); }} title="QR Code Preview">
                {qrLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-[#5A724A]" size={36} />
                            <p className="text-xs text-[#818181] font-semibold animate-pulse">Generating printable QR...</p>
                        </div>
                    </div>
                ) : qrData ? (
                    <div className="space-y-5">
                        <div className="bg-[#F8F8F8] rounded-3xl p-6 border border-[#EBEBEB] text-center shadow-xs">
                            <div className="inline-flex items-center gap-1.5 mb-3">
                                <span>🌿</span>
                                <span className="font-extrabold text-base text-[#222222]">Herb &amp; Spice</span>
                            </div>

                            <div className="flex justify-center my-3">
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#EBEBEB]">
                                    <img 
                                        src={qrData.qrImage} 
                                        alt={`QR Code for Table ${qrData.tableId}`}
                                        className="w-[240px] h-[240px] rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="mt-3">
                                <h3 className="text-lg font-extrabold text-[#222222]">Table {qrData.tableId}</h3>
                                <p className="text-xs text-[#818181]">Scan to open contactless guest menu</p>
                            </div>
                        </div>

                        {/* URL Box */}
                        <div className="bg-[#F8F8F8] rounded-2xl p-3 border border-[#EBEBEB] flex items-center gap-2.5">
                            <ExternalLink size={14} className="text-[#818181] shrink-0" />
                            <span className="text-xs text-[#818181] font-mono truncate flex-1">{qrData.url}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(qrData.url);
                                    toast.success('Menu URL copied!');
                                }}
                                className="text-xs text-[#5A724A] font-bold px-2.5 py-1 rounded-full bg-[#BCE2A3]/30 border border-[#BCE2A3]"
                            >
                                <Copy size={11} className="inline mr-1" /> Copy
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <Button 
                                onClick={handleDownloadQRImage}
                                variant="primary"
                                className="py-2.5 text-xs font-bold rounded-full"
                            >
                                <Download size={14} /> PNG
                            </Button>
                            <Button 
                                onClick={handlePrintQR}
                                variant="outline"
                                className="py-2.5 text-xs font-bold rounded-full"
                            >
                                <Printer size={14} /> Print
                            </Button>
                            <Button 
                                onClick={() => {
                                    setShowQRModal(false);
                                    setShowFullscreenQR(true);
                                }}
                                variant="outline"
                                className="py-2.5 text-xs font-bold rounded-full"
                            >
                                <Maximize size={14} /> Full
                            </Button>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* Fullscreen QR Overlay */}
            <AnimatePresence>
                {showFullscreenQR && qrData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-[#F4F6F0] flex flex-col items-center justify-center p-6 text-center"
                        onClick={() => setShowFullscreenQR(false)}
                    >
                        <button 
                            onClick={() => setShowFullscreenQR(false)}
                            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-[#222222] shadow-xs"
                        >
                            <X size={20} />
                        </button>

                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="text-2xl">🌿</span>
                            <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Herb &amp; Spice</h1>
                        </div>
                        <p className="text-xs uppercase tracking-widest text-[#5A724A] font-bold mb-6">Artisan Dining</p>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white p-6 rounded-3xl shadow-xl border border-[#EBEBEB]"
                        >
                            <img 
                                src={qrData.qrImage} 
                                alt={`QR Code for Table ${qrData.tableId}`}
                                className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] rounded-2xl"
                            />
                        </motion.div>

                        <h2 className="text-2xl font-extrabold text-[#222222] mt-6">Table {qrData.tableId}</h2>
                        <p className="text-xs text-[#818181] mt-1">Scan camera to explore digital dishes</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal: Add New Table */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Table">
                <form onSubmit={handleAddTable} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[#818181] uppercase tracking-wider mb-2 block">Table Number</label>
                        <input 
                            type="text"
                            required
                            placeholder="e.g. 11, 12, 14"
                            value={newTable.tableId}
                            onChange={(e) => setNewTable({...newTable, tableId: e.target.value})}
                            className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:border-[#5A724A] outline-none text-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[#818181] uppercase tracking-wider mb-2 block">Seating Capacity</label>
                        <input 
                            type="number"
                            required
                            min="1"
                            value={newTable.capacity}
                            onChange={(e) => setNewTable({...newTable, capacity: parseInt(e.target.value)})}
                            className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:border-[#5A724A] outline-none text-sm font-medium"
                        />
                    </div>
                    <Button type="submit" variant="primary" className="w-full py-3.5 rounded-full mt-4 font-bold text-sm">
                        <Save size={16} /> Save Table
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminTables;
