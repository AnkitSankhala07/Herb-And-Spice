const mongoose = require('mongoose');

const activityLogSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String }, // Admin, Kitchen
    action: { type: String, required: true }, // e.g., "Updated Menu", "Accepted Order"
    entityType: { type: String }, // Order, Menu, Inventory
    entityId: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
