const mongoose = require('mongoose');
const { ADMIN_ACTION_TYPES } = require('../config/constants');

const adminActionSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Admin reference is required']
    },
    actionType: {
        type: String,
        enum: ADMIN_ACTION_TYPES,
        required: [true, 'Action type is required']
    },
    targetType: {
        type: String,
        enum: ['User', 'Booking', 'Service'],
        required: [true, 'Target type is required']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Target ID is required'],
        refPath: 'targetType'
    },

    // Snapshot of state change
    previousState: {
        type: mongoose.Schema.Types.Mixed
    },
    newState: {
        type: mongoose.Schema.Types.Mixed
    },

    // Context
    reason: {
        type: String,
        maxlength: [1000, 'Reason cannot exceed 1000 characters']
    },

    // Request metadata
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Indexes
adminActionSchema.index({ admin: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });
adminActionSchema.index({ actionType: 1, createdAt: -1 });
adminActionSchema.index({ createdAt: -1 });

// This collection is write-only; no updates allowed
adminActionSchema.pre('updateOne', function () {
    throw new Error('AdminAction documents are immutable');
});

adminActionSchema.pre('findOneAndUpdate', function () {
    throw new Error('AdminAction documents are immutable');
});

const AdminAction = mongoose.model('AdminAction', adminActionSchema);

module.exports = AdminAction;
