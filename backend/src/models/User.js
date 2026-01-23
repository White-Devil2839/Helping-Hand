const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.CUSTOMER
    },

    // Helper-specific profile (only populated for helpers)
    helperProfile: {
        isVerified: { type: Boolean, default: false },
        verifiedAt: Date,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
        bio: { type: String, maxlength: 500 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        totalBookings: { type: Number, default: 0 }
    },

    // Auth tokens
    refreshToken: { type: String, select: false },

    // Timestamps
    lastLogin: Date,

    // Account state
    isActive: { type: Boolean, default: true },
    deactivatedAt: Date,
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ role: 1, 'helperProfile.isVerified': 1 });
userSchema.index({ isActive: 1 });

// Instance methods
userSchema.methods.isHelper = function () {
    return this.role === ROLES.HELPER;
};

userSchema.methods.isVerifiedHelper = function () {
    return this.role === ROLES.HELPER && this.helperProfile?.isVerified === true;
};

userSchema.methods.isAdmin = function () {
    return this.role === ROLES.ADMIN;
};

userSchema.methods.toPublicJSON = function () {
    const obj = this.toObject();
    delete obj.refreshToken;
    delete obj.__v;
    return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
