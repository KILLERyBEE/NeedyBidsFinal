const express = require('express');
const multer = require('multer');
const { uploadMultipleImagesToSupabase } = require('./imageUpload');
const { sendResultOrRedirect } = require('./respond');

/**
 * Create a base router for any category
 * @param {Object} model - Mongoose model
 * @param {string} categoryName - Name of the category (for folder organization)
 * @param {Array} requiredFields - Array of required field names
 * @param {Object} fieldValidations - Object with custom validation functions
 * @returns {express.Router} - Configured router
 */
const createBaseRouter = (model, categoryName, requiredFields = [], fieldValidations = {}) => {
  const router = express.Router();

  // Configure multer for memory storage (we'll upload to Supabase)
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 5 // Maximum 5 files
    }
  });

  // Input validation middleware
  const validateInput = (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Run custom validations
    for (const [field, validationFn] of Object.entries(fieldValidations)) {
      if (req.body[field] && !validationFn(req.body[field])) {
        return res.status(400).json({ 
          error: `Invalid value for field: ${field}` 
        });
      }
    }

    // Common validations
    if (req.body.basePrice && req.body.basePrice < 0) {
      return res.status(400).json({ error: 'Base price must be non-negative' });
    }

    if (req.body.auctionDuration) {
      const duration = parseInt(req.body.auctionDuration);
      if (isNaN(duration) || duration < 1 || duration > 30) {
        return res.status(400).json({ error: 'Auction duration must be between 1 and 30 days' });
      }
    }

    next();
  };

  // Photo validation middleware
  const validatePhotos = (req, res, next) => {
    if (!req.files || req.files.length !== 5) {
      return res.status(400).json({ error: 'Exactly 5 photos are required' });
    }

    for (let file of req.files) {
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'All files must be images' });
      }
    }

    next();
  };

  // POST route for form submission
  router.post("/submit", upload.array('photos', 5), validatePhotos, validateInput, async (req, res) => {
    try {
      console.log(`Files received for ${categoryName}:`, req.files ? req.files.length : 'No files');

      // Upload images to Supabase
      const imageUrls = await uploadMultipleImagesToSupabase(req.files, categoryName.toLowerCase());
      console.log('Uploaded image URLs:', imageUrls);

      // Prepare data object
      const itemData = { ...req.body };
      
      // Map image URLs to photo fields
      imageUrls.forEach((url, index) => {
        itemData[`photo${index + 1}`] = url;
      });

      // Create new item
      const newItem = new model(itemData);

      // Attach userid if authenticated
      newItem.userid = req.user && req.user._id;

      // Save to database
      await newItem.save();

      const result = {
        message: `${categoryName} item submitted successfully!`,
        itemId: newItem._id
      };
      return sendResultOrRedirect(req, res, result, '/');

    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error: ' + error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Duplicate entry found' });
      }
      console.error(`Error submitting ${categoryName} item:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET route to fetch all items
  router.get("/", async (req, res) => {
    try {
      const items = await model.find().sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      console.error(`Error fetching ${categoryName} items:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET route to fetch single item
  router.get("/:id", async (req, res) => {
    try {
      const item = await model.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching ${categoryName} item:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Error handling middleware for multer errors
  router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected file field' });
      }
    }
    next(error);
  });

  return router;
};

module.exports = { createBaseRouter };
