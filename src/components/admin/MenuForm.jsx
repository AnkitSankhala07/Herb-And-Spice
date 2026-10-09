import { useState } from 'react';
import { Button } from '../ui/Button';

export const MenuForm = ({ initialData, inventoryItems, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        category: '',
        price: '',
        imageUrl: '',
        isVeg: true,
        ingredients: [],
        description: '',
        popularityScore: 50,
        isAvailable: true
    });

    const handleAddIngredient = () => {
        setFormData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { ingredientId: '', quantityRequired: 0 }]
        }));
    };

    const handleRemoveIngredient = (index) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const handleIngredientChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((ing, i) => i === index ? { ...ing, [field]: field === 'quantityRequired' ? Number(value) : value } : ing)
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 p-1 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider">Menu Item Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all font-medium text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider">Category</label>
                    <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all text-sm"
                        placeholder="e.g. Burgers, Starters"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider">Price (₹)</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#5A724A] font-bold font-mono focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all text-sm"
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider">Image URL</label>
                    <input
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all font-mono text-xs"
                        placeholder="https://..."
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="3"
                        className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all text-sm leading-relaxed"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-[#F8F8F8] p-4 rounded-2xl border border-[#EBEBEB]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input type="checkbox" name="isVeg" checked={formData.isVeg} onChange={handleChange} className="peer sr-only" />
                            <div className="w-5 h-5 border-2 border-[#EBEBEB] rounded-md peer-checked:bg-[#5A724A] peer-checked:border-[#5A724A] transition-all flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                        </div>
                        <span className="text-[#222222] text-sm font-semibold group-hover:text-[#5A724A] transition-colors">Vegetarian</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} className="peer sr-only" />
                            <div className="w-5 h-5 border-2 border-[#EBEBEB] rounded-md peer-checked:bg-[#5A724A] peer-checked:border-[#5A724A] transition-all flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                        </div>
                        <span className="text-[#222222] text-sm font-semibold group-hover:text-[#5A724A] transition-colors">Item Available</span>
                    </label>
                </div>
            </div>

            {/* Ingredients Section */}
            <div className="pt-5 mt-5 border-t border-[#EBEBEB]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h4 className="text-xs font-bold text-[#222222] uppercase tracking-wider">Bill of Materials</h4>
                        <p className="text-xs text-[#818181] mt-0.5">Link inventory items used to prepare this dish.</p>
                    </div>
                    <button type="button" onClick={handleAddIngredient} className="text-xs text-[#5A724A] font-bold bg-[#BCE2A3]/30 hover:bg-[#BCE2A3]/50 px-3.5 py-1.5 rounded-full border border-[#BCE2A3] transition-all">+ Add Item</button>
                </div>

                <div className="space-y-3">
                    {formData.ingredients.map((ing, i) => (
                        <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-center bg-[#F8F8F8] p-3 rounded-2xl border border-[#EBEBEB]">
                            <select
                                value={ing.ingredientId?._id || ing.ingredientId || ''}
                                onChange={(e) => handleIngredientChange(i, 'ingredientId', e.target.value)}
                                className="w-full sm:flex-1 bg-white border border-[#EBEBEB] rounded-xl text-sm text-[#222222] p-2.5 focus:border-[#5A724A] outline-none"
                            >
                                <option value="" className="text-[#818181]">Select Inventory Item...</option>
                                {inventoryItems.map(inv => (
                                    <option key={inv._id} value={inv._id} className="text-[#222222]">{inv.name} ({inv.unit})</option>
                                ))}
                            </select>
                            <div className="flex gap-3 w-full sm:w-auto items-center">
                                <div className="relative flex-1 sm:w-28">
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={ing.quantityRequired}
                                        onChange={(e) => handleIngredientChange(i, 'quantityRequired', e.target.value)}
                                        className="w-full bg-white border border-[#EBEBEB] rounded-xl text-sm font-mono text-[#5A724A] font-bold p-2.5 focus:border-[#5A724A] outline-none pr-8"
                                        step="0.01"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#818181] pointer-events-none">qty</span>
                                </div>
                                <button type="button" onClick={() => handleRemoveIngredient(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all flex-shrink-0" title="Remove ingredient">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {formData.ingredients.length === 0 && (
                        <div className="p-6 text-center border border-dashed border-[#EBEBEB] rounded-2xl bg-[#F8F8F8]/50">
                            <p className="text-xs text-[#818181] font-medium">No ingredients linked yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-5 mt-4 border-t border-[#EBEBEB]">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary">
                    Save Menu Item
                </Button>
            </div>
        </form>
    );
};
