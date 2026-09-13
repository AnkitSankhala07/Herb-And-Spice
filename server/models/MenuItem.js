const mongoose = require('mongoose');

const menuItemSchema = mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String },
    isVeg: { type: Boolean, default: true },
    ingredients: [{
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
        quantityRequired: { type: Number, required: true } // e.g., 0.2 units
    }],
    popularityScore: { type: Number, default: 0 }, // For AI sorting
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
