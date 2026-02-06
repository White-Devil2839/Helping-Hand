const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking reference is required']
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for system messages
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'system'],
        default: 'text'
    },

    // Read receipts
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],

    // For image messages (future extension)
    imageUrl: String
}, {
    timestamps: true
});

// Indexes
messageSchema.index({ booking: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

/**
 * Mark message as read by a user
 * @param {ObjectId} userId
 */
messageSchema.methods.markReadBy = function (userId) {
    const alreadyRead = this.readBy.some(r => r.user.equals(userId));
    if (!alreadyRead) {
        this.readBy.push({ user: userId, readAt: new Date() });
    }
};

/**
 * Check if message was read by a user
 * @param {ObjectId} userId
 * @returns {boolean}
 */
messageSchema.methods.isReadBy = function (userId) {
    return this.readBy.some(r => r.user.equals(userId));
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
