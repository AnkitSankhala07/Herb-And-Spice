const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    tableNumber: { type: Number, required: true },
    items: [{
        menuItem: { type: String }, // Changed from ObjectId to String to support Mock IDs
        name: { type: String },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Paid', 'Cancelled'],
        default: 'Pending'
    },
    tip: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ['Cash', 'Online', 'Pending'], default: 'Pending' },
    estimatedPrepTime: { type: Number, default: 15 } // In Minutes
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
