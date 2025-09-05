const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../config/supabase');

// Configure multer for memory storage (not disk storage)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024, // 2MB default
	},
	fileFilter: (req, file, cb) => {
		// Check file type
		const allowedTypes = /jpeg|jpg|png|gif|webp/;
		const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
		const mimetype = allowedTypes.test(file.mimetype);

		if (mimetype && extname) {
			return cb(null, true);
		} else {
			cb(new Error('Only image files are allowed!'), false);
		}
	}
});

// Middleware for single file upload
const uploadProfilePicture = upload.single('profilePicture');

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				success: false,
				message: 'File too large. Maximum size is 2MB for profile pictures.'
			});
		}
		return res.status(400).json({
			success: false,
			message: 'File upload error: ' + err.message
		});
	} else if (err) {
		return res.status(400).json({
			success: false,
			message: err.message
		});
	}
	next();
};

// Middleware to upload file to Supabase Storage
const uploadToSupabase = async (req, res, next) => {
	try {
		if (!req.file) {
			return next();
		}

		// Create a unique filename
		const timestamp = Date.now();
		const uniqueSuffix = timestamp + '-' + Math.round(Math.random() * 1E9);
		const ext = path.extname(req.file.originalname);
		const filename = 'profile-' + uniqueSuffix + ext;
		const filePath = `profile-pictures/${filename}`;
		const bucketName = 'profile-pictures';

		// Upload the file buffer to Supabase Storage (v2 API)
		const { data, error } = await supabase.storage
			.from(bucketName)
			.upload(filePath, req.file.buffer, { contentType: req.file.mimetype });
		if (error) {
			throw error;
		}

		// Get the public URL
		const { data: publicUrlData } = supabase.storage
			.from(bucketName)
			.getPublicUrl(filePath);

		// Add the URL and path to the request object
		req.file.supabaseUrl = publicUrlData.publicUrl;
		req.file.supabasePath = filePath;

		next();
	} catch (error) {
		console.error('Supabase upload error:', error);
		return res.status(500).json({
			success: false,
			message: 'Error uploading to cloud storage'
		});
	}
};

// Helper function to delete old profile picture from Supabase Storage
const deleteOldProfilePicture = async (filePath) => {
	if (filePath) {
		try {
			const bucketName = 'profile-pictures';
			const { error } = await supabase.storage
				.from(bucketName)
				.remove([filePath]);
			if (error) {
				throw error;
			}
			console.log('Old profile picture deleted successfully');
		} catch (error) {
			console.error('Error deleting old profile picture:', error);
		}
	}
};

module.exports = {
	uploadProfilePicture,
	handleUploadError,
	uploadToSupabase,
	deleteOldProfilePicture
};
