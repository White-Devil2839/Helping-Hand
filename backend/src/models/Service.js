const mongoose = require('mongoose');
const { SERVICE_CATEGORIES } = require('../config/constants');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Service name is required'],
        unique: true,
        trim: true,
        maxlength: [100, 'Service name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        enum: SERVICE_CATEGORIES,
        required: [true, 'Category is required']
    },
    icon: {
        type: String,
        default: 'help-circle' // Default icon name for React Native vector icons
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ name: 'text', description: 'text' });

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
