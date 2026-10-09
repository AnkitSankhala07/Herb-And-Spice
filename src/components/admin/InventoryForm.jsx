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
        <form onSubmit={handleSubmit} className="space-y-5 p-1">
            <div>
                <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider">Item Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all font-medium text-sm"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider">Quantity</label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.1"
                        className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all font-mono text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider">Unit</label>
                    <input
                        type="text"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all text-sm"
                        placeholder="kg, pcs, liters"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-[#818181] mb-2 uppercase tracking-wider flex items-center gap-2">
                    Low Stock Threshold
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Alert trigger</span>
                </label>
                <input
                    type="number"
                    name="threshold"
                    value={formData.threshold}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-3.5 text-[#222222] focus:outline-none focus:border-[#5A724A] focus:ring-2 focus:ring-[#5A724A]/10 transition-all font-mono text-sm"
                />
            </div>

            <div className="flex gap-3 justify-end pt-5 border-t border-[#EBEBEB] mt-6">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary">
                    Save Item
                </Button>
            </div>
        </form>
    );
};
