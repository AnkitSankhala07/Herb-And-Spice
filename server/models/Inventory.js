const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Cheese"
    quantity: { type: Number, required: true }, // e.g., 50
    unit: { type: String, required: true }, // e.g., "kg"
    threshold: { type: Number, default: 10 }, // Low stock warning level
    lastRestocked: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inventory', inventorySchema);
