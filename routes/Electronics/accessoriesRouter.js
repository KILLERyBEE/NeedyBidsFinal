const express = require('express');
const multer = require('multer');
const accessories = require('../../models/Electronics/accessories');
const { uploadMultipleImagesToSupabase } = require('../../utils/imageUpload');

const accessoriesRouter = express.Router();
const { authenticateToken } = require('../../middleware/auth');

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
const validateAccessoriesInput = (req, res, next) => {
  const { sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, productType, brand, condition, description } = req.body;

  if (!sellerName || !contactNumber || !email || !pincode || !city || !state || !auctionType || basePrice === undefined || !auctionDuration || !adTitle) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  if (basePrice < 0) {
    return res.status(400).json({ error: 'Base price must be non-negative' });
  }

  if (!['1 day', '3 days', '7 days', '15 days'].includes(auctionDuration)) {
    return res.status(400).json({ error: 'Invalid auction duration' });
  }

  if (!['Reserve', 'No Reserve'].includes(auctionType)) {
    return res.status(400).json({ error: 'Invalid auction type' });
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
// Require authentication so we can attach userid to saved items
accessoriesRouter.post("/submit", authenticateToken, upload.array('accessoryPhotos', 5), validatePhotos, validateAccessoriesInput, async (req, res) => {
  try {
  // files received

    // Upload images to Supabase
    const imageUrls = await uploadMultipleImagesToSupabase(req.files, 'accessories');

    const {
      sellerName,
      contactNumber,
      email,
      pincode,
      city,
      state,
      auctionType,
      basePrice,
      auctionDuration,
      adTitle,
      productType,
      brand,
      model,
      condition,
      description
    } = req.body;
    
          // Get username from logged-in user (assumes authentication middleware sets req.user)
      const username = req.user && req.user.username ? req.user.username : (req.body.username || 'unknown');

    // Build and save single accessories item
    const accessoriesItem = new accessories({
      sellerName,
      contactNumber,
      email,
      pincode,
      city,
      state,
      auctionType,
      basePrice,
      auctionDuration,
      adTitle,
      productType,
      brand,
      model,
      condition,
      description,
      photo1: imageUrls[0],
      photo2: imageUrls[1],
      photo3: imageUrls[2],
      photo4: imageUrls[3],
      photo5: imageUrls[4],
      username
    });

    accessoriesItem.userid = req.user && req.user._id;
    await accessoriesItem.save();

    const result = { message: 'Accessories item submitted successfully!', itemId: accessoriesItem._id };
    const { sendResultOrRedirect } = require('../../utils/respond');
    return sendResultOrRedirect(req, res, result, '/');



  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error: ' + error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate entry found' });
    }
    console.error('Error submitting accessories item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to fetch all accessories
accessoriesRouter.get("/", async (req, res) => {
  try {
    const items = await accessories.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching accessories items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to fetch single accessory
accessoriesRouter.get("/:id", async (req, res) => {
  try {
    const item = await accessories.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching accessory item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware for multer errors
accessoriesRouter.use((error, req, res, next) => {
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

module.exports = accessoriesRouter;
