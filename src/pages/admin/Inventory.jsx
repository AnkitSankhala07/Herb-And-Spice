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
    const [activeTab, setActiveTab] = useState(location.pathname.includes('menu') ? 'menu' : 'inventory');

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
        <div className="p-2 md:p-4 max-w-[1600px] mx-auto min-h-screen text-[#222222] space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">Catalog Management</h1>
                    <p className="text-[#818181] text-xs mt-1">Manage kitchen ingredients and artisan menu offerings.</p>
                </div>
                <div className="flex bg-white p-1 rounded-full border border-[#EBEBEB] shadow-xs self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all",
                            activeTab === 'inventory' ? "bg-[#5A724A] text-white shadow-xs" : "text-[#818181] hover:text-[#222222]"
                        )}
                    >
                        <Package size={16} />
                        Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all",
                            activeTab === 'menu' ? "bg-[#5A724A] text-white shadow-xs" : "text-[#818181] hover:text-[#222222]"
                        )}
                    >
                        <UtensilsCrossed size={16} />
                        Menu Dishes
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
                    <Card className="bg-white border border-[#EBEBEB] p-6 md:p-8 min-h-[500px] shadow-[0_4px_24px_rgba(90,114,74,0.06)] rounded-3xl">
                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-xl font-bold text-[#222222]">
                                {activeTab === 'inventory' ? 'Kitchen Stock Overview' : 'Menu Dish Catalog'}
                            </h2>
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={handleSeedSampleData}
                                    disabled={isSeeding}
                                    className="flex items-center gap-1.5 bg-[#F8F8F8] hover:bg-[#EBEBEB] text-[#222222] border border-[#EBEBEB] px-4 py-2 rounded-full transition-all font-semibold text-xs disabled:opacity-50"
                                >
                                    {isSeeding ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} className="text-[#5A724A]" />}
                                    {isSeeding ? 'Seeding...' : 'Load Sample Data'}
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="flex items-center gap-1.5 bg-[#5A724A] hover:bg-[#485D3B] text-white px-5 py-2 rounded-full transition-all font-bold text-xs shadow-xs"
                                >
                                    <Plus size={16} />
                                    Add New {activeTab === 'inventory' ? 'Item' : 'Dish'}
                                </button>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        {activeTab === 'inventory' && (
                            <div className="overflow-x-auto rounded-2xl border border-[#EBEBEB] bg-white">
                                <table className="w-full text-left">
                                    <thead className="bg-[#F8F8F8] text-[11px] text-[#818181] uppercase tracking-wider font-bold border-b border-[#EBEBEB]">
                                        <tr>
                                            <th className="p-4 pl-6">Item Name</th>
                                            <th className="p-4">Stock Level</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EBEBEB]">
                                        {inventory.map((item) => {
                                            const isCritical = item.quantity < item.threshold;
                                            const isLow = item.quantity < item.threshold * 2;
                                            return (
                                                <tr key={item._id} className="hover:bg-[#F8F8F8]/60 transition-colors group">
                                                    <td className="p-4 pl-6 font-semibold text-sm text-[#222222]">{item.name}</td>
                                                    <td className="p-4 font-mono font-bold text-sm text-[#5A724A]">
                                                        {item.quantity} <span className="text-[#818181] text-xs font-sans tracking-wide ml-1">{item.unit}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={clsx(
                                                            "px-3 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                                                            isCritical ? "bg-red-50 text-red-700 border-red-200" :
                                                                isLow ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                    "bg-[#BCE2A3]/30 text-[#425934] border-[#BCE2A3]"
                                                        )}>
                                                            {isCritical && <AlertTriangle size={10} />}
                                                            {isCritical ? 'Critical' : isLow ? 'Low' : 'Healthy'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="w-8 h-8 rounded-full bg-[#F8F8F8] border border-[#EBEBEB] hover:border-[#5A724A] hover:text-[#5A724A] text-[#818181] flex items-center justify-center transition-all shadow-2xs"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            className="w-8 h-8 rounded-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all shadow-2xs"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {inventory.length === 0 && !isLoading && (
                                            <tr><td colSpan="4" className="p-12 text-center text-[#818181] border-0 text-xs">No inventory items recorded yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Menu Grid */}
                        {activeTab === 'menu' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {menuItems.map((item) => (
                                    <div key={item._id} className="group relative bg-white border border-[#EBEBEB] rounded-3xl overflow-hidden hover:border-[#5A724A] transition-all duration-300 shadow-[0_4px_16px_rgba(90,114,74,0.04)] hover:shadow-[0_12px_28px_rgba(90,114,74,0.1)]">
                                        <div className="aspect-video relative overflow-hidden bg-[#F4F6F0]">
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                                                <div>
                                                    <h3 className="text-base font-bold text-white leading-tight mb-0.5">{item.name}</h3>
                                                    <p className="text-[#BCE2A3] font-mono font-bold text-sm tracking-tight">₹{item.price}</p>
                                                </div>
                                            </div>
                                            <div className="absolute top-2.5 right-2.5 flex gap-1">
                                                <span className={clsx(
                                                    "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-xs",
                                                    item.isAvailable ? "bg-white/95 text-[#5A724A] border-[#BCE2A3]" : "bg-white/95 text-red-600 border-red-200"
                                                )}>
                                                    {item.isAvailable ? 'Available' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-center text-[11px] text-[#818181] mb-4 font-semibold uppercase tracking-wider">
                                                <span className="bg-[#F8F8F8] px-2.5 py-0.5 rounded-full border border-[#EBEBEB]">{item.category}</span>
                                                <div className="flex items-center gap-1.5 border border-[#EBEBEB] px-2.5 py-0.5 bg-[#F8F8F8] rounded-full">
                                                    <div className={clsx("w-2 h-2 rounded-full", item.isVeg ? "bg-[#5A724A]" : "bg-red-500")} />
                                                    <span className={item.isVeg ? "text-[#5A724A]" : "text-red-700"}>{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2.5">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="flex-1 bg-[#F8F8F8] hover:bg-[#EBEBEB] text-[#222222] py-2 rounded-full border border-[#EBEBEB] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Edit2 size={13} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-full border border-red-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {menuItems.length === 0 && !isLoading && (
                                    <div className="col-span-full py-20 text-center text-[#818181] flex flex-col items-center">
                                        <UtensilsCrossed size={44} className="mb-2 opacity-30 text-[#5A724A]" />
                                        <p className="text-sm font-semibold">No menu dishes found. Add your first recipe.</p>
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
