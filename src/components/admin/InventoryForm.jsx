import { useState } from 'react';
import { Button } from '../ui/Button';

export const InventoryForm = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        quantity: 0,
        unit: 'kg',
        threshold: 5
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' || name === 'threshold' ? Number(value) : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 p-2">
            <div>
                <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Item Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-surface border border-border rounded-xl p-3 text-foreground-pale focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Quantity</label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.1"
                        className="w-full bg-surface border border-border rounded-xl p-3 text-foreground-pale focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Unit</label>
                    <input
                        type="text"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                        className="w-full bg-surface border border-border rounded-xl p-3 text-foreground-pale focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        placeholder="kg, pcs, liters"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide flex items-center gap-2">
                    Low Stock Threshold
                    <span className="text-xs font-normal text-amber lowercase bg-amber/10 px-2 py-0.5 rounded border border-amber/20">trigger alert</span>
                </label>
                <input
                    type="number"
                    name="threshold"
                    value={formData.threshold}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full bg-surface border border-border rounded-xl p-3 text-foreground-pale focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                />
            </div>

            <div className="flex gap-3 justify-end pt-6 mb-2 border-t border-border mt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="bg-transparent border border-border text-muted hover:text-foreground-pale hover:bg-surface font-bold">
                    Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-background font-bold shadow-lg shadow-primary/20">
                    Save Item
                </Button>
            </div>
        </form>
    );
};
