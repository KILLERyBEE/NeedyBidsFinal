const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkSubscription, useSubscriptionItem } = require('../middleware/subscription');
const { canUserListItem, useItemFromSubscription } = require('../utils/subscriptionUtils');

// Example route that requires subscription to list an item
router.post('/list-item', authenticateToken, checkSubscription, useSubscriptionItem, async (req, res) => {
    try {
        // At this point, the middleware has already:
        // 1. Checked if user has active subscription
        // 2. Verified user has items remaining
        // 3. Used one item from subscription
        // 4. Updated the user's subscription

        // Your item listing logic here
        const itemData = req.body;
        
        // Example: Save item to database
        // const newItem = await Item.create({
        //     ...itemData,
        //     userId: req.user._id,
        //     listedAt: new Date()
        // });

        // Get updated subscription info from middleware
        const subscriptionInfo = res.locals.subscription;

        res.json({
            success: true,
            message: 'Item listed successfully',
            item: {
                // id: newItem._id,
                // ...itemData
            },
            subscription: {
                totalItems: subscriptionInfo.totalItems,
                itemsUsed: subscriptionInfo.itemsUsed,
                remainingItems: subscriptionInfo.remainingItems
            }
        });

    } catch (error) {
        console.error('Error listing item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list item'
        });
    }
});

// Alternative approach using utility functions
router.post('/list-item-alt', authenticateToken, async (req, res) => {
    try {
        // Check if user can list item
        const canListResult = await canUserListItem(req.user._id);
        
        if (!canListResult.canList) {
            return res.status(403).json({
                success: false,
                error: canListResult.reason,
                code: canListResult.code,
                subscription: canListResult.subscription
            });
        }

        // Use an item from subscription
        const useItemResult = await useItemFromSubscription(req.user._id);
        
        if (!useItemResult.success) {
            return res.status(403).json({
                success: false,
                error: useItemResult.reason,
                code: useItemResult.code,
                subscription: useItemResult.subscription
            });
        }

        // Your item listing logic here
        const itemData = req.body;
        
        // Example: Save item to database
        // const newItem = await Item.create({
        //     ...itemData,
        //     userId: req.user._id,
        //     listedAt: new Date()
        // });

        res.json({
            success: true,
            message: 'Item listed successfully',
            item: {
                // id: newItem._id,
                // ...itemData
            },
            subscription: useItemResult.subscription
        });

    } catch (error) {
        console.error('Error listing item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list item'
        });
    }
});

// Route to check subscription status
router.get('/subscription-status', authenticateToken, async (req, res) => {
    try {
        const { getUserSubscriptionStatus } = require('../utils/subscriptionUtils');
        const subscriptionStatus = await getUserSubscriptionStatus(req.user._id);

        res.json({
            success: true,
            subscription: subscriptionStatus
        });

    } catch (error) {
        console.error('Error getting subscription status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get subscription status'
        });
    }
});

// Route to check premium features
router.get('/premium-features', authenticateToken, async (req, res) => {
    try {
        const { getUserPremiumStatus } = require('../utils/subscriptionUtils');
        const premiumStatus = await getUserPremiumStatus(req.user._id);

        res.json({
            success: true,
            premium: premiumStatus
        });

    } catch (error) {
        console.error('Error getting premium status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get premium status'
        });
    }
});

module.exports = router;
