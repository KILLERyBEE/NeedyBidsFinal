const User = require('../models/User');

/**
 * Middleware to check if user has an active subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkSubscription = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Find user and check subscription
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!user.hasActiveSubscription()) {
            return res.status(403).json({
                success: false,
                error: 'Active subscription required to list items',
                code: 'SUBSCRIPTION_REQUIRED'
            });
        }

        // Check if user has items remaining
        if (!user.canListMoreItems()) {
            return res.status(403).json({
                success: false,
                error: 'No items remaining in subscription',
                code: 'NO_ITEMS_REMAINING',
                subscription: {
                    totalItems: user.subscription.totalItems,
                    itemsUsed: user.subscription.itemsUsed,
                    remainingItems: user.getRemainingItems(),
                    extraItemPrice: user.subscription.extraItemPrice
                }
            });
        }

        // Add user info to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Error checking subscription status'
        });
    }
};

/**
 * Middleware to use an item from subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const useSubscriptionItem = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(400).json({
                success: false,
                error: 'User not found'
            });
        }

        // Use an item from user's subscription
        const itemUsed = req.user.useItem();
        
        if (!itemUsed) {
            return res.status(403).json({
                success: false,
                error: 'Cannot use item - subscription limit reached',
                code: 'SUBSCRIPTION_LIMIT_REACHED'
            });
        }

        // Save the updated user
        await req.user.save();

        // Add updated subscription info to response
        res.locals.subscription = {
            totalItems: req.user.subscription.totalItems,
            itemsUsed: req.user.subscription.itemsUsed,
            remainingItems: req.user.getRemainingItems()
        };

        next();
    } catch (error) {
        console.error('Error using subscription item:', error);
        res.status(500).json({
            success: false,
            error: 'Error using subscription item'
        });
    }
};

/**
 * Optional subscription check - doesn't block if no subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalSubscriptionCheck = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }

        // Find user and check subscription
        const user = await User.findById(req.user._id);
        if (user && user.hasActiveSubscription()) {
            req.user = user;
            req.hasActiveSubscription = true;
        } else {
            req.hasActiveSubscription = false;
        }

        next();
    } catch (error) {
        console.error('Error in optional subscription check:', error);
        req.hasActiveSubscription = false;
        next();
    }
};

/**
 * Get subscription status for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getSubscriptionStatus = async (req, res, next) => {
    try {
        if (!req.user) {
            req.subscriptionStatus = {
                hasActiveSubscription: false,
                canListItems: false,
                remainingItems: 0,
                totalItems: 0,
                itemsUsed: 0
            };
            return next();
        }

        const user = await User.findById(req.user._id);
        if (user && user.hasActiveSubscription()) {
            const subscriptionStatus = user.getSubscriptionStatus();
            req.subscriptionStatus = {
                hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
                canListItems: subscriptionStatus.canListMoreItems,
                remainingItems: subscriptionStatus.remainingItems,
                totalItems: subscriptionStatus.totalItems,
                itemsUsed: subscriptionStatus.itemsUsed,
                planId: subscriptionStatus.currentPlan,
                planName: subscriptionStatus.planName,
                extraItemPrice: subscriptionStatus.extraItemPrice
            };
        } else {
            req.subscriptionStatus = {
                hasActiveSubscription: false,
                canListItems: false,
                remainingItems: 0,
                totalItems: 0,
                itemsUsed: 0
            };
        }

        next();
    } catch (error) {
        console.error('Error getting subscription status:', error);
        req.subscriptionStatus = {
            hasActiveSubscription: false,
            canListItems: false,
            remainingItems: 0,
            totalItems: 0,
            itemsUsed: 0
        };
        next();
    }
};

module.exports = {
    checkSubscription,
    useSubscriptionItem,
    optionalSubscriptionCheck,
    getSubscriptionStatus
};
