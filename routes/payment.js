const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Plan configurations (copied from subscription.js)
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

router.get('/', authenticateToken, (req, res) => {
    const { amount, planId, quantity } = req.query;
    res.render('payment', { amount, planId, quantity });
});

router.post('/success', authenticateToken, async (req, res) => {
    try {
        const { planId, quantity } = req.body;

        if (planId) {
            const plan = PLANS[planId];
            if (!plan) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid plan ID'
                });
            }

            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            user.activateSubscription(
                plan.id,
                plan.title,
                plan.totalItems,
                plan.extraItemPrice,
                plan.duration
            );

            await user.save();

            res.redirect('/packages');
        } else if (quantity) {
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

            user.purchaseExtraItems(parseInt(quantity), user.subscription.extraItemPrice);
            await user.save();

            res.redirect('/packages');
        } else {
            res.status(400).json({ success: false, error: 'Invalid request' });
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process payment'
        });
    }
});

module.exports = router;
