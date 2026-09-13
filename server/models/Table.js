const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    tableId: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, default: 4 },
    status: { type: String, enum: ['available', 'occupied', 'cleaning'], default: 'available' },
    currentBill: { type: Number, default: 0 },
    sessionStart: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
