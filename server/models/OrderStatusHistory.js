const mongoose = require('mongoose');

const orderStatusHistorySchema = mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    status: { type: String, required: true },
    changedBy: { type: String, default: 'System' }, // Kitchen, Admin, System
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
