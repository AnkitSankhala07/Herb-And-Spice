import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { InventoryForm } from '../../components/admin/InventoryForm';
import { MenuForm } from '../../components/admin/MenuForm';
import { Plus, Edit2, Trash2, Package, UtensilsCrossed, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { MENU_ITEMS, SAMPLE_INVENTORY } from '../../services/mockData';

const InventoryPage = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.pathname.includes('menu') ? 'menu' : 'inventory'); // 'inventory' | 'menu'

    const [inventory, setInventory] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invRes, menuRes] = await Promise.all([
                api.get('/inventory').catch(() => ({ data: [] })),
                api.get('/menu').catch(() => ({ data: [] }))
            ]);
            const invData = Array.isArray(invRes.data) && invRes.data.length > 0 ? invRes.data : SAMPLE_INVENTORY;
            const menuData = Array.isArray(menuRes.data) && menuRes.data.length > 0 ? menuRes.data : MENU_ITEMS;
            setInventory(invData);
            setMenuItems(menuData);
        } catch (err) {
            console.error("Failed to load data, using sample data:", err);
            setInventory(SAMPLE_INVENTORY);
            setMenuItems(MENU_ITEMS);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedSampleData = async () => {
        setIsSeeding(true);
        try {
            await api.post('/menu/seed');
            toast.success('Sample data seeded successfully to database!');
            await fetchData();
        } catch (err) {
            console.warn("Backend seed failed or offline, loading local sample data:", err);
            setInventory(SAMPLE_INVENTORY);
            setMenuItems(MENU_ITEMS);
            toast.success('Sample menu and inventory data loaded!');
        } finally {
            setIsSeeding(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            if (activeTab === 'inventory') {
                await api.delete(`/inventory/${id}`);
            } else {
                await api.delete(`/menu/${id}`);
            }
            fetchData();
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete item.");
        }
    };

    const handleSave = async (data) => {
        try {
            if (activeTab === 'inventory') {
                if (editingItem) {
                    await api.put(`/inventory/${editingItem._id}`, data);
                } else {
                    await api.post('/inventory', data);
                }
            } else {
                if (editingItem) {
                    await api.put(`/menu/${editingItem._id}`, data);
                } else {
                    await api.post('/menu', data);
                }
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save. Check console.");
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen text-foreground space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground-pale mb-1 tracking-tight">System Catalog</h1>
                    <p className="text-muted text-sm tracking-wide">Manage inventory logistics and menu offerings.</p>
                </div>
                <div className="flex bg-elevated p-1 rounded-xl border border-border shadow-inner self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'inventory' ? "bg-primary text-background shadow-[0_4px_15px_-3px_rgba(139,94,60,0.4)]" : "text-muted hover:text-foreground-pale hover:bg-surface"
                        )}
                    >
                        <Package size={18} />
                        Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'menu' ? "bg-primary text-background shadow-[0_4px_15px_-3px_rgba(139,94,60,0.4)]" : "text-muted hover:text-foreground-pale hover:bg-surface"
                        )}
                    >
                        <UtensilsCrossed size={18} />
                        Menu Data
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="bg-surface border-border p-6 md:p-8 min-h-[500px] shadow-xl relative overflow-hidden">
                        {/* Subtle background glow */}
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
                            <h2 className="text-2xl font-display font-bold text-foreground-pale tracking-tight">
                                {activeTab === 'inventory' ? 'Stock Overview' : 'Menu Offerings'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSeedSampleData}
                                    disabled={isSeeding}
                                    className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2.5 rounded-xl transition-all font-bold text-sm disabled:opacity-50"
                                    title="Seed and refresh sample menu and inventory items"
                                >
                                    {isSeeding ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {isSeeding ? 'Seeding...' : 'Load Sample Data'}
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="flex items-center gap-2 bg-teal/10 hover:bg-teal/20 text-teal border border-teal/20 px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-[0_4px_15px_-3px_rgba(58,140,114,0.2)]"
                                >
                                    <Plus size={18} />
                                    Add New {activeTab === 'inventory' ? 'Item' : 'Dish'}
                                </button>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        {activeTab === 'inventory' && (
                            <div className="overflow-x-auto rounded-xl border border-border bg-elevated shadow-inner relative z-10">
                                <table className="w-full text-left">
                                    <thead className="bg-surface text-xs text-muted uppercase tracking-widest font-bold border-b border-border">
                                        <tr>
                                            <th className="p-4 pl-6">Item Name</th>
                                            <th className="p-4">Stock Level</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {inventory.map((item) => {
                                            const isCritical = item.quantity < item.threshold;
                                            const isLow = item.quantity < item.threshold * 2;
                                            return (
                                                <tr key={item._id} className="hover:bg-surface/50 transition-colors group">
                                                    <td className="p-4 pl-6 font-medium text-foreground-pale">{item.name}</td>
                                                    <td className="p-4 font-mono font-bold text-gold">
                                                        {item.quantity} <span className="text-muted text-xs font-sans tracking-wide ml-1">{item.unit}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={clsx(
                                                            "px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1",
                                                            isCritical ? "bg-danger/10 text-danger border-danger/20" :
                                                                isLow ? "bg-amber/10 text-amber border-amber/20" :
                                                                    "bg-teal/10 text-teal border-teal/20"
                                                        )}>
                                                            {isCritical && <AlertTriangle size={10} />}
                                                            {isCritical ? 'Critical' : isLow ? 'Low' : 'Healthy'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(item)} className="p-2 hover:bg-elevated border border-transparent hover:border-border rounded-lg text-muted hover:text-primary transition-all" title="Edit">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg text-muted hover:text-danger transition-all" title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {inventory.length === 0 && !isLoading && (
                                            <tr><td colSpan="4" className="p-12 text-center text-muted border-0">No inventory items strictly tracked.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Menu Table */}
                        {activeTab === 'menu' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                {menuItems.map((item) => (
                                    <div key={item._id} className="group relative bg-elevated border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                                        <div className="aspect-video relative overflow-hidden bg-surface">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent flex items-end p-5">
                                                <div>
                                                    <h3 className="text-lg font-display font-bold text-foreground-pale leading-tight mb-1">{item.name}</h3>
                                                    <p className="text-gold font-mono font-bold text-sm tracking-tight">₹{item.price}</p>
                                                </div>
                                            </div>
                                            <div className="absolute top-3 right-3 flex gap-1">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded backdrop-blur-md text-[10px] font-bold uppercase tracking-widest border",
                                                    item.isAvailable ? "bg-teal/20 text-teal border-teal/30" : "bg-danger/20 text-danger border-danger/30"
                                                )}>
                                                    {item.isAvailable ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-center text-xs text-muted mb-4 font-medium uppercase tracking-wider">
                                                <span className="bg-surface px-2 py-1 rounded border border-border">{item.category}</span>
                                                <div className="flex items-center gap-1.5 opacity-90 border border-border px-2 py-1 bg-surface rounded">
                                                    <div className={clsx("w-2 h-2 rounded-full", item.isVeg ? "bg-teal shadow-[0_0_8px_rgba(58,140,114,0.6)]" : "bg-danger shadow-[0_0_8px_rgba(196,75,58,0.6)]")} />
                                                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => handleEdit(item)} className="flex-1 bg-surface hover:bg-border/50 text-foreground-pale py-2.5 rounded-xl border border-border text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                                <button onClick={() => handleDelete(item._id)} className="flex-1 bg-danger/5 hover:bg-danger/10 text-danger py-2.5 rounded-xl border border-danger/20 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {menuItems.length === 0 && !isLoading && (
                                    <div className="col-span-full py-24 text-center text-muted flex flex-col items-center">
                                        <UtensilsCrossed size={48} className="mb-4 opacity-30" />
                                        <p className="text-lg">No menu items found. Add your first dish.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </motion.div>
            </AnimatePresence>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${editingItem ? 'Edit' : 'Add New'} ${activeTab === 'inventory' ? 'Inventory Item' : 'Dish'}`}
            >
                {activeTab === 'inventory' ? (
                    <InventoryForm
                        initialData={editingItem}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                    />
                ) : (
                    <MenuForm
                        initialData={editingItem}
                        inventoryItems={inventory}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                    />
                )}
            </Modal>
        </div>
    );
};

export default InventoryPage;

