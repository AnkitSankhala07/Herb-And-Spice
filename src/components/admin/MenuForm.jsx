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
        <form onSubmit={handleSubmit} className="space-y-5 p-2 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Menu Item Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-surface border border-border rounded-xl p-3 text-foreground-pale focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Category</label>
                    <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full bg-surface border border-border rounded-xl p-3 text-foreground-pale focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        placeholder="e.g. Burgers"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Price (₹)</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        className="w-full bg-surface border border-border rounded-xl p-3 text-gold font-bold font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Image URL</label>
                    <input
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        required
                        className="w-full bg-surface border border-border rounded-xl p-3 text-foreground-pale focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm"
                        placeholder="https://..."
                    />
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="3"
                        className="w-full bg-surface border border-border rounded-xl p-3 text-foreground-pale focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm leading-relaxed"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-surface p-4 rounded-xl border border-border">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input type="checkbox" name="isVeg" checked={formData.isVeg} onChange={handleChange} className="peer sr-only" />
                            <div className="w-5 h-5 border-2 border-border rounded peer-checked:bg-teal peer-checked:border-teal transition-all flex items-center justify-center">
                                <svg className="w-3 h-3 text-surface opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                        </div>
                        <span className="text-foreground-pale text-sm font-bold group-hover:text-teal transition-colors">Vegetarian</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} className="peer sr-only" />
                            <div className="w-5 h-5 border-2 border-border rounded peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                <svg className="w-3 h-3 text-background opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                        </div>
                        <span className="text-foreground-pale text-sm font-bold group-hover:text-primary transition-colors">Available Output</span>
                    </label>
                </div>
            </div>

            {/* Ingredients Section */}
            <div className="pt-6 mt-6 border-t border-border">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h4 className="text-sm font-bold text-foreground-pale uppercase tracking-wide">Bill of Materials</h4>
                        <p className="text-xs text-muted mt-1">Link inventory items used to prepare this dish.</p>
                    </div>
                    <button type="button" onClick={handleAddIngredient} className="text-xs text-teal hover:text-teal/80 font-bold bg-teal/10 px-3 py-1.5 rounded-lg border border-teal/20 transition-all">+ Add Item</button>
                </div>

                <div className="space-y-3">
                    {formData.ingredients.map((ing, i) => (
                        <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-center bg-surface p-3 sm:pr-4 rounded-xl border border-border">
                            <select
                                value={ing.ingredientId?._id || ing.ingredientId || ''}
                                onChange={(e) => handleIngredientChange(i, 'ingredientId', e.target.value)}
                                className="w-full sm:flex-1 bg-elevated border-none rounded-lg text-sm text-foreground-pale p-3 focus:ring-1 focus:ring-primary/50 outline-none"
                            >
                                <option value="" className="text-muted">Select Inventory Item...</option>
                                {inventoryItems.map(inv => (
                                    <option key={inv._id} value={inv._id} className="text-foreground-pale">{inv.name} ({inv.unit})</option>
                                ))}
                            </select>
                            <div className="flex gap-3 w-full sm:w-auto items-center">
                                <div className="relative flex-1 sm:w-28">
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={ing.quantityRequired}
                                        onChange={(e) => handleIngredientChange(i, 'quantityRequired', e.target.value)}
                                        className="w-full bg-elevated border-none rounded-lg text-sm font-mono text-gold font-bold p-3 focus:ring-1 focus:ring-primary/50 outline-none pr-8"
                                        step="0.01"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-sans pointer-events-none">qty</span>
                                </div>
                                <button type="button" onClick={() => handleRemoveIngredient(i)} className="text-danger/50 hover:text-danger hover:bg-danger/10 p-2 rounded-lg transition-all flex-shrink-0" title="Remove ingredient">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {formData.ingredients.length === 0 && (
                        <div className="p-6 text-center border border-dashed border-border rounded-xl">
                            <p className="text-sm text-muted font-medium">No ingredients linked yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 mt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent border border-border text-muted hover:text-foreground-pale hover:bg-surface font-bold">
                    Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-background font-bold shadow-lg shadow-primary/20">
                    Save Menu Item
                </Button>
            </div>
        </form>
    );
};
