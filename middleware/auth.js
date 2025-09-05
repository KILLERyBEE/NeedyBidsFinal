const jwt = require('jsonwebtoken');
const User = require('../models/User');

function ejsAuthenticate(req, res, next) {
	let token = req.cookies?.token;
	if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		token = req.headers.authorization.split(' ')[1];
	}
	if (token) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			if (decoded && decoded.userId) {
				// Fetch full user document and attach public profile to res.locals for EJS rendering
				User.findById(decoded.userId).select('-password').then(userDoc => {
					if (userDoc) {
						req.user = userDoc; // attach full user for downstream handlers
						// make public profile available to EJS templates via res.locals.user
						try {
							res.locals.user = userDoc.getPublicProfile();
						} catch (e) {
							res.locals.user = userDoc.toObject();
						}
					}
					return next();
				}).catch(() => next());
				return;
			}
		} catch (err) {
			return res.redirect('/');
		}
	}
	return res.redirect('/');
}

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
	try {
		let token;
		const authHeader = req.headers['authorization'];
		if (authHeader && authHeader.startsWith('Bearer ')) {
			token = authHeader.split(' ')[1];
		} else if (req.cookies && req.cookies.token) {
			token = req.cookies.token;
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: 'Access token is required'
			});
		}

		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		// Find user by id
		const user = await User.findById(decoded.userId).select('-password');
		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'User not found'
			});
		}
		if (!user.isActive) {
			return res.status(401).json({
				success: false,
				message: 'Account is deactivated'
			});
		}
		// Add user to request object
		req.user = user;
		next();
	} catch (error) {
		if (error.name === 'JsonWebTokenError') {
			return res.status(401).json({
				success: false,
				message: 'Invalid token'
			});
		} else if (error.name === 'TokenExpiredError') {
			return res.status(401).json({
				success: false,
				message: 'Token expired'
			});
		}
        
		console.error('Auth middleware error:', error);
		return res.status(500).json({
			success: false,
			message: 'Authentication error'
		});
	}
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
	try {
		let token;
		const authHeader = req.headers['authorization'];
		if (authHeader && authHeader.startsWith('Bearer ')) {
			token = authHeader.split(' ')[1];
		} else if (req.cookies && req.cookies.token) {
			token = req.cookies.token;
		}

		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			const user = await User.findById(decoded.userId).select('-password');
            
			if (user && user.isActive) {
				req.user = user;
				// Make public profile available to EJS templates via res.locals.user
				try {
					res.locals.user = user.getPublicProfile();
				} catch (e) {
					res.locals.user = user.toObject();
				}
			}
		}
		
		// Always set up locals for EJS templates, even if no user
		res.locals.user = res.locals.user || null;
		res.locals.isAuthenticated = !!req.user;
        
		next();
	} catch (error) {
		// Continue without authentication if token is invalid
		res.locals.user = null;
		res.locals.isAuthenticated = false;
		next();
	}
};

// Generate JWT token
const generateToken = (userId) => {
	return jwt.sign(
		{ userId },
		process.env.JWT_SECRET,
		{ expiresIn: '7d' }
	);
};

module.exports = {
	ejsAuthenticate,
	authenticateToken,
	optionalAuth,
	generateToken
};
