const express = require('express');
const mongoose = require('mongoose');

// Test basic imports
console.log('🧪 Testing basic imports...');

try {
    const User = require('./models/User');
    console.log('✅ User model imported successfully');
} catch (error) {
    console.error('❌ Error importing User model:', error.message);
    process.exit(1);
}

try {
    const subscriptionRoutes = require('./routes/subscription');
    console.log('✅ Subscription routes imported successfully');
} catch (error) {
    console.error('❌ Error importing subscription routes:', error.message);
    process.exit(1);
}

try {
    const { authenticateToken } = require('./middleware/auth');
    console.log('✅ Auth middleware imported successfully');
} catch (error) {
    console.error('❌ Error importing auth middleware:', error.message);
    process.exit(1);
}

try {
    const { checkSubscription, useSubscriptionItem } = require('./middleware/subscription');
    console.log('✅ Subscription middleware imported successfully');
} catch (error) {
    console.error('❌ Error importing subscription middleware:', error.message);
    process.exit(1);
}

try {
    const { canUserListItem, useItemFromSubscription } = require('./utils/subscriptionUtils');
    console.log('✅ Subscription utilities imported successfully');
} catch (error) {
    console.error('❌ Error importing subscription utilities:', error.message);
    process.exit(1);
}

console.log('\n🎉 All imports successful! Server should start without errors.');
console.log('\n📝 Next steps:');
console.log('   1. Set up your .env file with Razorpay keys');
console.log('   2. Update the Razorpay key in views/pacakages.ejs');
console.log('   3. Start the server with: npm start');
console.log('   4. Test the subscription flow');
