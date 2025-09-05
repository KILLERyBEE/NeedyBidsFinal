const User = require('../models/User');

/**
 * Check if user can list an item
 * @param {string} userId - User ID
 * @returns {Object} - Result object with canList and details
 */
const canUserListItem = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                canList: false,
                reason: 'User not found',
                code: 'USER_NOT_FOUND'
            };
        }

        if (!user.hasActiveSubscription()) {
            return {
                canList: false,
                reason: 'Active subscription required',
                code: 'SUBSCRIPTION_REQUIRED',
                subscription: null
            };
        }

        if (!user.canListMoreItems()) {
            return {
                canList: false,
                reason: 'No items remaining in subscription',
                code: 'NO_ITEMS_REMAINING',
                subscription: {
                    totalItems: user.subscription.totalItems,
                    itemsUsed: user.subscription.itemsUsed,
                    remainingItems: user.getRemainingItems(),
                    extraItemPrice: user.subscription.extraItemPrice
                }
            };
        }

        return {
            canList: true,
            reason: 'User can list item',
            code: 'CAN_LIST',
            subscription: {
                totalItems: user.subscription.totalItems,
                itemsUsed: user.subscription.itemsUsed,
                remainingItems: user.getRemainingItems(),
                extraItemPrice: user.subscription.extraItemPrice
            }
        };
    } catch (error) {
        console.error('Error checking if user can list item:', error);
        return {
            canList: false,
            reason: 'Error checking subscription status',
            code: 'ERROR'
        };
    }
};

/**
 * Use an item from user's subscription
 * @param {string} userId - User ID
 * @returns {Object} - Result object with success and details
 */
const useItemFromSubscription = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                success: false,
                reason: 'User not found',
                code: 'USER_NOT_FOUND'
            };
        }

        if (!user.canListMoreItems()) {
            return {
                success: false,
                reason: 'No items remaining in subscription',
                code: 'NO_ITEMS_REMAINING',
                subscription: {
                    totalItems: user.subscription.totalItems,
                    itemsUsed: user.subscription.itemsUsed,
                    remainingItems: user.getRemainingItems(),
                    extraItemPrice: user.subscription.extraItemPrice
                }
            };
        }

        const itemUsed = user.useItem();
        if (!itemUsed) {
            return {
                success: false,
                reason: 'Failed to use item',
                code: 'ITEM_USE_FAILED'
            };
        }

        await user.save();

        return {
            success: true,
            reason: 'Item used successfully',
            code: 'ITEM_USED',
            subscription: {
                totalItems: user.subscription.totalItems,
                itemsUsed: user.subscription.itemsUsed,
                remainingItems: user.getRemainingItems(),
                extraItemPrice: user.subscription.extraItemPrice
            }
        };
    } catch (error) {
        console.error('Error using item from subscription:', error);
        return {
            success: false,
            reason: 'Error using item',
            code: 'ERROR'
        };
    }
};

/**
 * Get user's subscription status
 * @param {string} userId - User ID
 * @returns {Object} - Subscription status object
 */
const getUserSubscriptionStatus = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                hasActiveSubscription: false,
                canListItems: false,
                remainingItems: 0,
                totalItems: 0,
                itemsUsed: 0,
                planId: null,
                planName: null,
                extraItemPrice: 0
            };
        }

        const subscriptionStatus = user.getSubscriptionStatus();
        return {
            hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
            canListItems: subscriptionStatus.canListMoreItems,
            remainingItems: subscriptionStatus.remainingItems,
            totalItems: subscriptionStatus.totalItems,
            itemsUsed: subscriptionStatus.itemsUsed,
            planId: subscriptionStatus.currentPlan,
            planName: subscriptionStatus.planName,
            extraItemPrice: subscriptionStatus.extraItemPrice
        };
    } catch (error) {
        console.error('Error getting user subscription status:', error);
        return {
            hasActiveSubscription: false,
            canListItems: false,
            remainingItems: 0,
            totalItems: 0,
            itemsUsed: 0,
            planId: null,
            planName: null,
            extraItemPrice: 0
        };
    }
};

/**
 * Check if user has premium features
 * @param {string} userId - User ID
 * @returns {Object} - Premium status object
 */
const getUserPremiumStatus = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                isPremium: false,
                hasActiveSubscription: false,
                features: []
            };
        }

        const subscriptionStatus = user.getSubscriptionStatus();
        const features = [];

        if (subscriptionStatus.hasActiveSubscription) {
            features.push('list_items');
            features.push('premium_support');
            
            // Add plan-specific features
            switch (subscriptionStatus.currentPlan) {
                case 'quarterly':
                case 'yearly':
                    features.push('custom_domain');
                    features.push('advanced_analytics');
                    break;
                case 'yearly':
                    features.push('priority_support');
                    features.push('api_access');
                    break;
            }
        }

        return {
            isPremium: subscriptionStatus.isPremium,
            hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
            features: features,
            planId: subscriptionStatus.currentPlan,
            planName: subscriptionStatus.planName
        };
    } catch (error) {
        console.error('Error getting user premium status:', error);
        return {
            isPremium: false,
            hasActiveSubscription: false,
            features: []
        };
    }
};

module.exports = {
    canUserListItem,
    useItemFromSubscription,
    getUserSubscriptionStatus,
    getUserPremiumStatus
};
