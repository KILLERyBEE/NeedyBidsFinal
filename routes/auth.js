const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { uploadProfilePicture, handleUploadError, uploadToSupabase, deleteOldProfilePicture } = require('../middleware/upload');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();

// Validation middleware
const validateSignup = [
	body('username')
		.trim()
		.isLength({ min: 3, max: 20 })
		.withMessage('Username must be between 3 and 20 characters')
		.matches(/^[a-zA-Z0-9_]+$/)
		.withMessage('Username can only contain letters, numbers, and underscores'),
	body('email')
		.isEmail()
		.normalizeEmail()
		.withMessage('Please enter a valid email address'),
	body('password')
		.isLength({ min: 8 })
		.withMessage('Password must be at least 8 characters long')
		.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const validateSignin = [
	body('email')
		.isEmail()
		.normalizeEmail()
		.withMessage('Please enter a valid email address'),
	body('password')
		.notEmpty()
		.withMessage('Password is required')
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

// Helper to send OTP email
async function sendOtpEmail(email, otp) {
	try {
		// Check if SMTP configuration is available
		if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
			console.log('SMTP not configured, skipping email send');
			return { success: false, message: 'Email service not configured' };
		}

		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT || 587,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS
			}
		});

		await transporter.sendMail({
			from: process.env.EMAIL_FROM || process.env.SMTP_USER,
			to: email,
			subject: 'Your BidToBuy Email Verification OTP',
			text: `Your OTP for BidToBuy email verification is: ${otp}`
		});

		return { success: true };
	} catch (error) {
		console.error('Email sending error:', error);
		return { success: false, message: error.message };
	}
}

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup',
	uploadProfilePicture,
	handleUploadError,
	uploadToSupabase,
	validateSignup,
	handleValidationErrors,
	async (req, res) => {
		try {
			const { username, email, password } = req.body;
			const profilePicture = req.file;
            


			// Check if user already exists
			const existingUser = await User.findOne({
				$or: [{ email: email.toLowerCase() }, { username }]
			});

			if (existingUser) {
				// Delete uploaded file if user already exists
				if (profilePicture && profilePicture.supabasePath) {
					await deleteOldProfilePicture(profilePicture.supabasePath);
				}

				// If email exists but is not verified, allow re-signup
				if (existingUser.email === email.toLowerCase() && !existingUser.emailVerified) {
					// Delete the existing unverified user
					await User.findByIdAndDelete(existingUser._id);
					console.log('Deleted unverified user for re-signup');
				} else if (existingUser.email === email.toLowerCase()) {
					return res.status(400).json({
						success: false,
						message: 'Email already registered and verified'
					});
				} else {
					return res.status(400).json({
						success: false,
						message: 'Username already taken'
					});
				}
			}

			// Create new user
			const userData = {
				username,
				email: email.toLowerCase(),
				password
			};

			// Generate OTP
			const otp = Math.floor(100000 + Math.random() * 900000).toString();
			userData.verificationToken = otp;
			userData.verificationTokenExpires = Date.now() + 10 * 60 * 1000; // 10 min expiry
			userData.emailVerified = false;

			// Store Supabase profile picture URL in database
			if (profilePicture && profilePicture.supabaseUrl) {
				userData.profilePicture = profilePicture.supabaseUrl;
				userData.profilePicturePath = profilePicture.supabasePath;
			} else {
				userData.profilePicture = null;
				userData.profilePicturePath = null;
			}

			const user = new User(userData);
			await user.save();

			// Send OTP email
			const emailResult = await sendOtpEmail(user.email, otp);
            
			if (!emailResult.success) {
				// If email fails, still create the user but inform about email issue
				console.log('Email sending failed:', emailResult.message);
                
				res.status(201).json({
					success: true,
					message: `Account created successfully! However, we couldn't send the verification email. Please contact support or try again later. Your OTP is: ${otp}`,
					data: {
						user: user.getPublicProfile(),
						otp: otp // Include OTP in response for testing
					}
				});
			} else {
				res.status(201).json({
					success: true,
					message: 'Account created. Please verify your email with the OTP sent.',
					data: {
						user: user.getPublicProfile(),
					}
				});
			}

		} catch (error) {
			console.error('Signup error:', error);
            
			// Delete uploaded file if there's an error
			if (req.file) {
				await deleteOldProfilePicture(req.file.filename);
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
				message: 'Error creating account: ' + error.message
			});
		}
	}
);

// @route   POST /api/auth/verify-otp
// @desc    Verify email OTP and auto-login user
// @access  Public
router.post('/verify-otp', async (req, res) => {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) {
			return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
		}
        
		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res.status(400).json({ success: false, message: 'User not found.' });
		}
        
		if (user.emailVerified) {
			return res.status(400).json({ success: false, message: 'Email already verified.' });
		}
        
		if (user.verificationToken !== otp || !user.verificationTokenExpires || user.verificationTokenExpires < Date.now()) {
			return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
		}
        
		// Mark email as verified
		user.emailVerified = true;
		user.verificationToken = null;
		user.verificationTokenExpires = null;
		await user.save();
        
		// Generate JWT token for auto-login
		const token = generateToken(user._id);
		// Token generated for user (not logged for security)

		// Update last login
		user.lastLogin = new Date();
		await user.save();

			// Set JWT as HTTP-only cookie
			res.cookie('token', token, {
				httpOnly: true,
				secure: false, // Always false for localhost/dev
				sameSite: 'lax',
				path: '/',
				maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
			});

		const responseData = {
			success: true,
			message: 'Email verified successfully. You are now logged in!',
			data: {
				user: user.getPublicProfile(),
				token
			}
		};
		// Sending response (details not logged for security)

		res.json(responseData);
	} catch (error) {
		console.error('OTP verification error:', error);
		res.status(500).json({
			success: false,
			message: 'Error during OTP verification'
		});
	}
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to email
// @access  Public
router.post('/resend-otp', async (req, res) => {
	const { email } = req.body;
	if (!email) {
		return res.status(400).json({ success: false, message: 'Email is required.' });
	}
	const user = await User.findOne({ email: email.toLowerCase() });
	if (!user) {
		return res.status(400).json({ success: false, message: 'User not found.' });
	}
	if (user.emailVerified) {
		return res.status(400).json({ success: false, message: 'Email already verified.' });
	}
	// Generate new OTP
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	user.verificationToken = otp;
	user.verificationTokenExpires = Date.now() + 10 * 60 * 1000;
	await user.save();
	await sendOtpEmail(user.email, otp);
	res.json({ success: true, message: 'OTP resent to your email.' });
});

// @route   POST /api/auth/signin
// @desc    Authenticate user & get token
// @access  Public
router.post('/signin',
	validateSignin,
	handleValidationErrors,
	async (req, res) => {
		try {
			const { email, password } = req.body;

			// Find user by email or username
			const user = await User.findByEmailOrUsername(email);

			if (!user) {
				return res.status(401).json({
					success: false,
					message: 'Invalid credentials'
				});
			}

			// Check if account is active
			if (!user.isActive) {
				return res.status(401).json({
					success: false,
					message: 'Account is deactivated'
				});
			}

			// Check password
			const isPasswordValid = await user.comparePassword(password);
			if (!isPasswordValid) {
				return res.status(401).json({
					success: false,
					message: 'Invalid credentials'
				});
			}

			// Check if email is verified
			if (!user.emailVerified) {
				return res.status(401).json({
					success: false,
					message: 'Please verify your email before logging in.'
				});
			}

			// Generate JWT token
			const token = generateToken(user._id);

			// Update last login
			user.lastLogin = new Date();
			await user.save();

			// Set JWT as HTTP-only cookie
			res.cookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
			});

			res.json({
				success: true,
				message: 'Login successful',
				data: {
					user: user.getPublicProfile(),
					token
				}
			});

		} catch (error) {
			console.error('Signin error:', error);
			res.status(500).json({
				success: false,
				message: 'Error during login'
			});
		}
	}
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
	   try {
		   res.set('Cache-Control', 'no-store');
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

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', async (req, res) => {
	   try {
		   // Clear the token cookie
		   res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
		   res.json({
			   success: true,
			   message: 'Logged out successfully'
		   });
	   } catch (error) {
		   console.error('Logout error:', error);
		   res.status(500).json({
			   success: false,
			   message: 'Error during logout'
		   });
	   }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', async (req, res) => {
	try {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		// Generate new token
		const token = generateToken(req.user._id);

		res.json({
			success: true,
			message: 'Token refreshed successfully',
			data: {
				token
			}
		});

	} catch (error) {
		console.error('Token refresh error:', error);
		res.status(500).json({
			success: false,
			message: 'Error refreshing token'
		});
	}
});

// @route   GET /api/auth/test-email
// @desc    Test email configuration
// @access  Public
router.get('/test-email', async (req, res) => {
	try {
		if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
			return res.json({
				success: false,
				message: 'SMTP not configured',
				config: {
					host: process.env.SMTP_HOST || 'Not set',
					port: process.env.SMTP_PORT || 'Not set',
					user: process.env.SMTP_USER || 'Not set',
					from: process.env.EMAIL_FROM || 'Not set'
				}
			});
		}

		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT || 587,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS
			}
		});

		// Test the connection
		await transporter.verify();
        
		res.json({
			success: true,
			message: 'SMTP configuration is valid',
			config: {
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT || 587,
				user: process.env.SMTP_USER,
				from: process.env.EMAIL_FROM || process.env.SMTP_USER
			}
		});
	} catch (error) {
		res.json({
			success: false,
			message: 'SMTP configuration error: ' + error.message,
			config: {
				host: process.env.SMTP_HOST || 'Not set',
				port: process.env.SMTP_PORT || 'Not set',
				user: process.env.SMTP_USER || 'Not set',
				from: process.env.EMAIL_FROM || 'Not set'
			}
		});
	}
});

// TEMPORARY: Test Supabase connection and bucket listing
router.get('/test-supabase', async (req, res) => {
  const { supabase } = require('../config/supabase');
  const { data, error } = await supabase.storage.listBuckets();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ buckets: data });
});

module.exports = router;
