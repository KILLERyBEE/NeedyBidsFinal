// Generic auction route: fetch items from all models and render auction.ejs
const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { uploadProfilePicture, handleUploadError, uploadToSupabase, deleteOldProfilePicture } = require('../middleware/upload');
const router = express.Router();
const { ejsAuthenticate, optionalAuth } = require('../middleware/auth');
router.get('/auction', optionalAuth, async (req, res) => {
	try {
		const allItems = [];
		for (const [modelName, Model] of Object.entries(modelMap)) {
			try {
				const items = await Model.find({});
				items.forEach(item => {
					// Use the model's collection name (lowercase canonical) when available so
					// frontend links use the correct category path (e.g. 'mobiles').
					const canonicalName = (Model && Model.collection && Model.collection.name)
						? Model.collection.name
						: String(modelName).toLowerCase();
					allItems.push({
						_id: item._id,
						modelName: canonicalName,
						...item.toObject()
					});
				});
			} catch (err) {
				console.error(`Error loading items for model ${modelName}:`, err.message);
			}
		}
		allItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
		// Filter out items that are null or missing _id
	const validItems = allItems.filter(item => item && item._id && item.modelName);
	console.log('Filtered validItems:', validItems.map(i => ({ id: i._id, modelName: i.modelName })));
	res.render('auction', { 
		items: validItems, 
		user: req.user || null,
		isAuthenticated: !!req.user 
	});
	} catch (err) {
		console.error('Auction route error:', err.message);
		res.status(500).send('Error loading auction items');
	}
});


// Fetch all wishlisted items for a user
const mongoose = require('mongoose');
const modelMap = {
	Original: require('../models/Spare/original'),
	Aftermarket: require('../models/Spare/aftermarket'),
	BooksSports: require('../models/Pets/books-sports'),
	Aquarium: require('../models/Pets/aquarium'),
	PetAccessories: require('../models/Pets/pet-accessories'),
	Women: require('../models/Fashion/women'),
	Men: require('../models/Fashion/men'),
	Kids: require('../models/Fashion/kids'),
	Beds: require('../models/Furniture/beds'),
	Decor: require('../models/Furniture/decor'),
	KidsFurniture: require('../models/Furniture/kids-furniture'),
	Others: require('../models/Furniture/others'),
	Sofa: require('../models/Furniture/sofa'),
	Mobiles: require('../models/Mobilees/mobiles'),
	MobileAccessories: require('../models/Mobilees/mobileAccessories'),
	Tablets: require('../models/Mobilees/tablets'),
	Bicycles: require('../models/Vehicles/bicycles'),
	Bikes: require('../models/Vehicles/bikes'),
	Cars: require('../models/Vehicles/cars'),
	CommercialVehicles: require('../models/Vehicles/commericial-vehicles'),
	Scooters: require('../models/Vehicles/scooters'),
	Homes: require('../models/Property/homes'),
	Lands: require('../models/Property/lands'),
	Office: require('../models/Property/office'),
	Shops: require('../models/Property/shops'),
	Accessories: require('../models/Electronics/accessories'),
	Ac: require('../models/Electronics/ac'),
	Cameras: require('../models/Electronics/cameras'),
	Computers: require('../models/Electronics/computers'),
	Fridge: require('../models/Electronics/fridge'),
	Games: require('../models/Electronics/games'),
	Kitchen: require('../models/Electronics/kitchen'),
	Tv: require('../models/Electronics/tv'),
	Washing: require('../models/Electronics/washing'),
};

router.get('/wishlist/:userId', async (req, res) => {
	try {
		const userId = req.params.userId;
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ error: 'Invalid user ID format.' });
		}
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: 'User not found.' });
		const wishlist = [];
			for (let i = 0; i < user.wishlist.length; i++) {
				const itemId = user.wishlist[i];
				let modelName = user.wishlistModel[i];
				if (!modelName) continue;
				// Convert to PascalCase for modelMap lookup
				modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
				const Model = modelMap[modelName];
				if (Model) {
					const item = await Model.findById(itemId);
					if (item) wishlist.push({ ...item.toObject(), modelName });
				}
			}
		res.json({ success: true, items: wishlist });
	} catch (err) {
		res.status(500).json({ error: 'Server error.' });
	}
});


// Add item to wishlist
router.post('/wishlist/add', async (req, res) => {
	// console.log('Wishlist add request:', req.body);
	const { userId, itemId, modelName } = req.body;
	// console.log('userId:', userId, 'itemId:', itemId, 'modelName:', modelName);
	if (!userId || !itemId || !modelName) {
	// console.log('Missing required fields:', { userId, itemId, modelName });
		return res.status(400).json({ error: 'Missing required fields.' });
	}
	// Validate modelName (lowercase)
	   const allowedModels = [
		   'ac','accessories','cameras','computers','fridge','games','kitchen','tv','washing',
		   'kids','men','women',
		   'beds','decor','kids-furniture','others','sofa',
		   'mobileAccessories','mobiles','tablets',
		   'aquarium','books-sports','pet-accessories',
		   'homes','lands','office','shops',
		   'aftermarket','original','Original',
		   'bicycles','bikes','car','cars','commercial-vehicles','scooters'
	   ];
	   if (!allowedModels.includes(modelName) && !allowedModels.includes(modelName.toLowerCase())) {
		   console.log('Invalid modelName:', modelName);
		   return res.status(400).json({ error: 'Invalid modelName.' });
	   }
	try {
		const { userId, itemId, modelName } = req.body;
		if (!userId || !itemId || !modelName) {
			return res.status(400).json({ error: 'Missing required fields.' });
		}
		// Validate modelName (lowercase)
		const allowedModels = [
			'ac','accessories','cameras','computers','fridge','games','kitchen','tv','washing',
			'kids','men','women',
			'beds','decor','kids-furniture','others','sofa',
			'mobileAccessories','mobiles','tablets',
			'aquarium','books-sports','pet-accessories',
			'homes','lands','office','shops',
			'aftermarket','original',
			'bicycles','bikes','car','cars','commercial-vehicles','scooters'
		];
		   let modelKey = modelName;
		   if (modelName.toLowerCase() === 'car' || modelName.toLowerCase() === 'cars') modelKey = 'Cars';
			if (modelName.toLowerCase() === 'original') modelKey = 'original';
		   console.log('[WISHLIST ADD] userId:', userId, 'itemId:', itemId, 'modelKey:', modelKey);
		   try {
			   const user = await User.findById(userId);
			   if (!user) {
				   console.log('[WISHLIST ADD] User not found:', userId);
				   return res.status(404).json({ error: 'User not found.' });
			   }
			   // Add to wishlist if not already present
			   const alreadyExists = user.wishlist.some((id, idx) => id.equals(itemId) && user.wishlistModel[idx] === modelKey);
			   if (!alreadyExists) {
				   user.wishlist.push(itemId);
				   user.wishlistModel = user.wishlistModel || [];
				   user.wishlistModel.push(modelKey);
				   await user.save();
			   }
			   // Fetch updated user
			   const updatedUser = await User.findById(userId);
			   return res.json({ success: true, user: updatedUser });
		   } catch (err) {
			   console.log('[WISHLIST ADD] Error:', err);
			   return res.status(500).json({ error: 'Server error.' });
		   }
		// Fetch updated user
		const updatedUser = await User.findById(userId);
		res.json({ success: true, user: updatedUser });
	} catch (err) {
		res.status(500).json({ error: 'Server error.' });
	}
});



// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const validateProfileUpdate = [
	body('username')
		.optional()
		.trim()
		.isLength({ min: 3, max: 20 })
		.withMessage('Username must be between 3 and 20 characters')
		.matches(/^[a-zA-Z0-9_]+$/)
		.withMessage('Username can only contain letters, numbers, and underscores'),
	body('email')
		.optional()
		.isEmail()
		.normalizeEmail()
		.withMessage('Please enter a valid email address')
];

const validatePasswordChange = [
	body('currentPassword')
		.notEmpty()
		.withMessage('Current password is required'),
	body('newPassword')
		.isLength({ min: 8 })
		.withMessage('New password must be at least 8 characters long')
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			success: false,
			message: 'Validation failed',
			errors: errors.array().map(err => ({
				field: err.path,
				message: err.msg
			}))
		});
	}
	next();
};

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
	try {
		res.json({
			success: true,
			data: {
				user: req.user.getPublicProfile()
			}
		});
	} catch (error) {
		console.error('Get profile error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching profile'
		});
	}
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
	uploadProfilePicture,
	handleUploadError,
	uploadToSupabase,
	validateProfileUpdate,
	handleValidationErrors,
	async (req, res) => {
		try {
			const { username, email, contact, about } = req.body;
			const profilePicture = req.file;
			const updateData = {};

			// Check if username is being updated
			if (username && username !== req.user.username) {
				// Check if username is already taken
				const existingUser = await User.findOne({ username });
				if (existingUser) {
					// Delete uploaded file if username is taken
					if (profilePicture && profilePicture.supabasePath) {
						await deleteOldProfilePicture(profilePicture.supabasePath);
					}
					return res.status(400).json({
						success: false,
						message: 'Username already taken'
					});
				}
				updateData.username = username;
			}

			// Check if email is being updated
			if (email && email !== req.user.email) {
				// Check if email is already registered
				const existingUser = await User.findOne({ email: email.toLowerCase() });
				if (existingUser) {
					// Delete uploaded file if email is taken
					if (profilePicture && profilePicture.supabasePath) {
						await deleteOldProfilePicture(profilePicture.supabasePath);
					}
					return res.status(400).json({
						success: false,
						message: 'Email already registered'
					});
				}
				updateData.email = email.toLowerCase();
			}

			// Handle profile picture update
			if (profilePicture) {
				// Delete old profile picture if it exists
				if (req.user.profilePicturePath) {
					await deleteOldProfilePicture(req.user.profilePicturePath);
				}
				updateData.profilePicture = profilePicture.supabaseUrl;
				updateData.profilePicturePath = profilePicture.supabasePath;
			}

			// Update user
			const updatedUser = await User.findByIdAndUpdate(
				req.user._id,
				updateData,
				{ new: true, runValidators: true }
			).select('-password');

			// persist contact and about if present
			if (contact !== undefined) updatedUser.contact = contact;
			if (about !== undefined) updatedUser.about = about;
			await updatedUser.save();

			res.json({
				success: true,
				message: 'Profile updated successfully',
				data: {
					user: updatedUser.getPublicProfile()
				}
			});

		} catch (error) {
			console.error('Update profile error:', error);
            
			// Delete uploaded file if there's an error
			if (req.file && req.file.supabasePath) {
				await deleteOldProfilePicture(req.file.supabasePath);
			}

			if (error.code === 11000) {
				const field = Object.keys(error.keyValue)[0];
				return res.status(400).json({
					success: false,
					message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
				});
			}

			res.status(500).json({
				success: false,
				message: 'Error updating profile'
			});
		}
	}
);

// @route   PUT /api/user/password
// @desc    Change user password
// @access  Private
router.put('/password',
	validatePasswordChange,
	handleValidationErrors,
	async (req, res) => {
		try {
			const { currentPassword, newPassword } = req.body;

			// Verify current password
			const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
			if (!isCurrentPasswordValid) {
				return res.status(400).json({
					success: false,
					message: 'Current password is incorrect'
				});
			}

			// Update password
			req.user.password = newPassword;
			await req.user.save();

			res.json({
				success: true,
				message: 'Password changed successfully'
			});

		} catch (error) {
			console.error('Change password error:', error);
			res.status(500).json({
				success: false,
				message: 'Error changing password'
			});
		}
	}
);

// @route   DELETE /api/user/profile-picture
// @desc    Remove user profile picture
// @access  Private
router.delete('/profile-picture', async (req, res) => {
	try {
		if (!req.user.profilePicture) {
			return res.status(400).json({
				success: false,
				message: 'No profile picture to remove'
			});
		}

		// Delete the file from storage
		await deleteOldProfilePicture(req.user.profilePicture);

		// Remove profile picture reference from database
		req.user.profilePicture = null;
		await req.user.save();

		res.json({
			success: true,
			message: 'Profile picture removed successfully',
			data: {
				user: req.user.getPublicProfile()
			}
		});

	} catch (error) {
		console.error('Remove profile picture error:', error);
		res.status(500).json({
			success: false,
			message: 'Error removing profile picture'
		});
	}
});

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', async (req, res) => {
	try {
		// Delete profile picture if exists
		if (req.user.profilePicture) {
			await deleteOldProfilePicture(req.user.profilePicture);
		}

		// Delete user account
		await User.findByIdAndDelete(req.user._id);

		res.json({
			success: true,
			message: 'Account deleted successfully'
		});

	} catch (error) {
		console.error('Delete account error:', error);
		res.status(500).json({
			success: false,
			message: 'Error deleting account'
		});
	}
});

// @route   GET /api/user/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res) => {
	try {
		const stats = {
			memberSince: req.user.createdAt,
			lastLogin: req.user.lastLogin,
			totalUsers: await User.countDocuments(),
			isEmailVerified: req.user.emailVerified
		};

		res.json({
			success: true,
			data: {
				stats
			}
		});

	} catch (error) {
		console.error('Get stats error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching statistics'
		});
	}
});

// Public endpoint to get user info by username (for chat, etc.)
router.get('/public/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }, 'username profilePicture');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove item from wishlist
router.post('/wishlist/remove', async (req, res) => {
	const { userId, itemId, modelName } = req.body;
	if (!userId || !itemId || !modelName) {
		return res.status(400).json({ error: 'Missing required fields.' });
	}
	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: 'User not found.' });
		// Remove item and modelName from arrays
		const idx = user.wishlist.findIndex((id, i) => id.equals(itemId) && user.wishlistModel[i] === modelName);
		if (idx !== -1) {
			user.wishlist.splice(idx, 1);
			user.wishlistModel.splice(idx, 1);
			await user.save();
			return res.json({ success: true });
		} else {
			return res.status(404).json({ error: 'Item not found in wishlist.' });
		}
	} catch (err) {
		res.status(500).json({ error: 'Server error.' });
	}
});

module.exports = router;
