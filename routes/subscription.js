const express = require('express');
const router = express.Router();

const crypto = require('crypto');
// Subscription model is no longer needed as we're using User model
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Initialize Razorpay


// Plan configurations
const PLANS = {
    monthly: {
        id: 'monthly',
        title: 'Monthly Access',
        description: 'Best for testing the platform',
        price: 1999,
        period: 'month',
        saveNote: 'No long-term commitment',
        totalItems: 100,
        extraItemPrice: 199,
        duration: 30 // days
    },
    quarterly: {
        id: 'quarterly',
        title: 'Quarterly Access',
        description: 'Balanced plan for steady sellers',
        price: 4999,
        period: '3 months',
        saveNote: 'Save 17% compared to monthly',
        totalItems: 500,
        extraItemPrice: 149,
        duration: 90 // days
    },
    yearly: {
        id: 'yearly',
        title: 'Yearly Access',
        description: 'Best value for high-volume sellers',
        price: 17999,
        period: '12 months',
        saveNote: 'Save 25% compared to monthly',
        totalItems: 1800,
        extraItemPrice: 149,
        duration: 365 // days
    }
};

// Get all plans
router.get('/plans', (req, res) => {
    try {
        res.json({
            success: true,
            plans: Object.values(PLANS)
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plans'
        });
    }
});

// Get user's current subscription
router.get('/current', authenticateToken, async (req, res) => {
    try {
        // Refresh user data from database
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const subscriptionStatus = user.getSubscriptionStatus();
        
        if (!subscriptionStatus.hasActiveSubscription) {
            return res.json({
                success: true,
                subscription: null
            });
        }

        res.json({
            success: true,
            subscription: {
                id: user._id,
                planId: subscriptionStatus.currentPlan,
                planName: subscriptionStatus.planName,
                status: subscriptionStatus.hasActiveSubscription ? 'active' : 'inactive',
                startDate: subscriptionStatus.subscriptionStartDate,
                endDate: subscriptionStatus.subscriptionEndDate,
                itemsUsed: subscriptionStatus.itemsUsed,
                totalItems: subscriptionStatus.totalItems,
                remainingItems: subscriptionStatus.remainingItems,
                extraItemsPurchased: subscriptionStatus.extraItemsPurchased,
                extraItemPrice: subscriptionStatus.extraItemPrice,
                isActive: subscriptionStatus.hasActiveSubscription
            }
        });
    } catch (error) {
        console.error('Error fetching current subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription'
        });
    }
});

// Create order for subscription
router.post('/create-order', authenticateToken, async (req, res) => {
    try {
        const { planId } = req.body;
        
        if (!PLANS[planId]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid plan ID'
            });
        }

        const plan = PLANS[planId];
        const amount = plan.price;

        res.redirect(`/payment?amount=${amount}&planId=${planId}`);

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order'
        });
    }
});

// Verify payment and activate subscription


// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!user.hasActiveSubscription()) {
            return res.status(404).json({
                success: false,
                error: 'No active subscription found'
            });
        }

        // Cancel subscription using User model method
        user.cancelSubscription();
        await user.save();

        res.json({
            success: true,
            message: 'Subscription cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel subscription'
        });
    }
});

// Purchase extra items
router.post('/purchase-extra-items', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        
        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid quantity'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!user.hasActiveSubscription()) {
            return res.status(404).json({
                success: false,
                error: 'No active subscription found'
            });
        }

        const amount = quantity * user.subscription.extraItemPrice;

        res.redirect(`/payment?amount=${amount}&quantity=${quantity}`);

    } catch (error) {
        console.error('Error creating extra items order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create extra items order'
        });
    }
});

// Verify extra items payment


// Get subscription history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const subscriptionStatus = user.getSubscriptionStatus();
        
        // For now, we'll return the current subscription status
        // In a real implementation, you might want to store subscription history separately
        const history = [];
        
        if (subscriptionStatus.hasActiveSubscription) {
            history.push({
                id: user._id,
                planId: subscriptionStatus.currentPlan,
                planName: subscriptionStatus.planName,
                amount: PLANS[subscriptionStatus.currentPlan]?.price || 0,
                status: 'active',
                startDate: subscriptionStatus.subscriptionStartDate,
                endDate: subscriptionStatus.subscriptionEndDate,
                itemsUsed: subscriptionStatus.itemsUsed,
                totalItems: subscriptionStatus.totalItems,
                extraItemsPurchased: subscriptionStatus.extraItemsPurchased,
                createdAt: subscriptionStatus.subscriptionStartDate
            });
        }

        res.json({
            success: true,
            subscriptions: history
        });

    } catch (error) {
        console.error('Error fetching subscription history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription history'
        });
    }
});

module.exports = router;
