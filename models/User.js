const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: [true, 'Username is required'],
		unique: true,
		trim: true,
		minlength: [3, 'Username must be at least 3 characters long'],
		maxlength: [20, 'Username cannot exceed 20 characters'],
		match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
	},
	email: {
		type: String,
		required: [true, 'Email is required'],
		unique: true,
		trim: true,
		lowercase: true,
		match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
	},
	password: {
		type: String,
		required: [true, 'Password is required'],
		minlength: [8, 'Password must be at least 8 characters long']
	},
	profilePicture: {
		type: String,
		default: null
		// Now stores Supabase Storage URL
	},
	profilePicturePath: {
		type: String,
		default: null
		// Stores Supabase Storage path for deletion purposes
	},
	isActive: {
		type: Boolean,
		default: true
	},
	lastLogin: {
		type: Date,
		default: null
	},
	emailVerified: {
		type: Boolean,
		default: false
	},
	verificationToken: {
		type: String,
		default: null
	},
	verificationTokenExpires: {
		type: Date,
		default: null
	},
	resetPasswordToken: {
		type: String,
		default: null
	},
	resetPasswordExpires: {
		type: Date,
		default: null
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	},
	about: {
		type: String,
		default: null
	},
	contact: {
		type: String,
		default: null
	},
	isPremium: {
		type: Boolean,
		default: false
	},
	subscription: {
		currentPlan: {
			type: String,
			enum: ['monthly', 'quarterly', 'yearly', null],
			default: null
		},
		planName: {
			type: String,
			default: null
		},
		subscriptionStartDate: {
			type: Date,
			default: null
		},
		subscriptionEndDate: {
			type: Date,
			default: null
		},
		itemsUsed: {
			type: Number,
			default: 0
		},
		totalItems: {
			type: Number,
			default: 0
		},
		extraItemsPurchased: {
			type: Number,
			default: 0
		},
		extraItemPrice: {
			type: Number,
			default: 0
		},
		lastItemUsedAt: {
			type: Date,
			default: null
		}
	},
	wishlist: [{
		type: mongoose.Schema.Types.ObjectId,
		refPath: 'wishlistModel',
	}],
	wishlistModel: [{
		type: String,
		enum: [
			'ac','accessories','cameras','computers','fridge','games','kitchen','tv','washing'
			,'kids','men','women',
			'beds','decor','kids-furniture','others','sofa',
			'mobileAccessories','mobiles','tablets',
			'aquarium','books-sports','pet-accessories',
			'homes','lands','office','shops',
			'aftermarket','original',
			'bicycles','bikes','cars','commercial-vehicles','scooters'
		]
	}]
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
	this.updatedAt = Date.now();
	next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
	// Only hash the password if it has been modified (or is new)
	if (!this.isModified('password')) return next();
    
	try {
		// Generate a salt
		const salt = await bcrypt.genSalt(10);
		// Hash the password along with the new salt
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Method to return public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
	const userObject = this.toObject();
    
	// Remove sensitive fields
	delete userObject.password;
	delete userObject.verificationToken;
	delete userObject.verificationTokenExpires;
	delete userObject.resetPasswordToken;
	delete userObject.resetPasswordExpires;
	delete userObject.profilePicturePath; // Don't expose Supabase path to clients
    
	return userObject;
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = async function(emailOrUsername) {
	return this.findOne({
		$or: [
			{ email: emailOrUsername.toLowerCase() },
			{ username: emailOrUsername }
		]
	});
};

// Subscription-related methods
userSchema.methods.hasActiveSubscription = function() {
	return this.isPremium && 
		   this.subscription.currentPlan && 
		   this.subscription.subscriptionEndDate && 
		   new Date() <= this.subscription.subscriptionEndDate;
};

userSchema.methods.getRemainingItems = function() {
	if (!this.hasActiveSubscription()) {
		return 0;
	}
	return Math.max(0, this.subscription.totalItems - this.subscription.itemsUsed);
};

userSchema.methods.canListMoreItems = function() {
	return this.hasActiveSubscription() && this.getRemainingItems() > 0;
};

userSchema.methods.useItem = function() {
	if (this.canListMoreItems()) {
		this.subscription.itemsUsed += 1;
		this.subscription.lastItemUsedAt = new Date();
		return true;
	}
	return false;
};

userSchema.methods.purchaseExtraItems = function(quantity, pricePerItem) {
	if (this.hasActiveSubscription()) {
		this.subscription.extraItemsPurchased += quantity;
		this.subscription.totalItems += quantity;
		this.subscription.extraItemPrice = pricePerItem;
		return true;
	}
	return false;
};

userSchema.methods.activateSubscription = function(planId, planName, totalItems, extraItemPrice, duration) {
	this.isPremium = true;
	this.subscription.currentPlan = planId;
	this.subscription.planName = planName;
	this.subscription.subscriptionStartDate = new Date();
	this.subscription.subscriptionEndDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000); // duration in days
	this.subscription.itemsUsed = 0;
	this.subscription.totalItems = totalItems;
	this.subscription.extraItemsPurchased = 0;
	this.subscription.extraItemPrice = extraItemPrice;
	this.subscription.lastItemUsedAt = null;
};

userSchema.methods.cancelSubscription = function() {
	this.isPremium = false;
	this.subscription.currentPlan = null;
	this.subscription.planName = null;
	this.subscription.subscriptionStartDate = null;
	this.subscription.subscriptionEndDate = null;
	this.subscription.itemsUsed = 0;
	this.subscription.totalItems = 0;
	this.subscription.extraItemsPurchased = 0;
	this.subscription.extraItemPrice = 0;
	this.subscription.lastItemUsedAt = null;
};

userSchema.methods.getSubscriptionStatus = function() {
	return {
		isPremium: this.isPremium,
		hasActiveSubscription: this.hasActiveSubscription(),
		currentPlan: this.subscription.currentPlan,
		planName: this.subscription.planName,
		subscriptionStartDate: this.subscription.subscriptionStartDate,
		subscriptionEndDate: this.subscription.subscriptionEndDate,
		itemsUsed: this.subscription.itemsUsed,
		totalItems: this.subscription.totalItems,
		remainingItems: this.getRemainingItems(),
		extraItemsPurchased: this.subscription.extraItemsPurchased,
		extraItemPrice: this.subscription.extraItemPrice,
		canListMoreItems: this.canListMoreItems(),
		lastItemUsedAt: this.subscription.lastItemUsedAt
	};
};

const User = mongoose.model('User', userSchema);

module.exports = User;
