const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: String,
        required: true,
        enum: ['monthly', 'quarterly', 'yearly']
    },
    planName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'cancelled', 'expired', 'failed'],
        default: 'pending'
    },
    
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    itemsUsed: {
        type: Number,
        default: 0
    },
    totalItems: {
        type: Number,
        required: true
    },
    extraItemsPurchased: {
        type: Number,
        default: 0
    },
    extraItemPrice: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
subscriptionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
    return this.status === 'active' && new Date() <= this.endDate;
};

// Method to get remaining items
subscriptionSchema.methods.getRemainingItems = function() {
    return Math.max(0, this.totalItems - this.itemsUsed);
};

// Method to check if user can list more items
subscriptionSchema.methods.canListMoreItems = function() {
    return this.isActive() && this.getRemainingItems() > 0;
};

// Method to use an item
subscriptionSchema.methods.useItem = function() {
    if (this.canListMoreItems()) {
        this.itemsUsed += 1;
        return true;
    }
    return false;
};

// Method to purchase extra items
subscriptionSchema.methods.purchaseExtraItems = function(quantity) {
    this.extraItemsPurchased += quantity;
    this.totalItems += quantity;
    return true;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
