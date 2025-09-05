const express = require('express');
const multer = require('multer');
const Computers = require('../../models/Electronics/computers');
const { uploadMultipleImagesToSupabase } = require('../../utils/imageUpload');

const computersRouter = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { sendResultOrRedirect } = require('../../utils/respond');

// Multer config for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

// Input validation middleware
const validateComputersInput = (req, res, next) => {
  const {
    sellerName, contactNumber, email, pincode, city, state,
    auctionType, basePrice, auctionDuration, adTitle, deviceType,
    brand, model, processor, ram, storageType, storageSize, condition, description
  } = req.body;

  if (!sellerName || !contactNumber || !email || !pincode || !city || !state ||
      !auctionType || basePrice === undefined || auctionDuration === undefined ||
      !adTitle) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  if (basePrice < 0) {
    return res.status(400).json({ error: 'Base price must be non-negative' });
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

// POST route for Computers submission
computersRouter.post(
  "/submit",
  authenticateToken,
  upload.array('computerPhotos', 5),
  validatePhotos,
  validateComputersInput,
  async (req, res) => {
    try {
      const imageUrls = await uploadMultipleImagesToSupabase(req.files, 'computers');
      const {
        sellerName, contactNumber, email, pincode, city, state,
        auctionType, basePrice, auctionDuration, adTitle, deviceType,
        brand, model, processor, ram, storageType, storageSize, condition, warranty, description
      } = req.body;
      // Get username from logged-in user (assumes authentication middleware sets req.user)
      const username = req.user && req.user.username ? req.user.username : (req.body.username || 'unknown');

      const computerItem = new Computers({
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
        deviceType,
        brand,
        model,
        processor,
        ram,
        storageType,
        storageSize,
        condition,
        warranty,
        description,
        photo1: imageUrls[0],
        photo2: imageUrls[1],
        photo3: imageUrls[2],
        photo4: imageUrls[3],
        photo5: imageUrls[4],
        username
      });
  computerItem.userid = req.user && req.user._id;
  await computerItem.save();
  const result = { message: 'Computer item submitted successfully!', itemId: computerItem._id };
  return sendResultOrRedirect(req, res, result, '/');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error: ' + error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Duplicate entry found' });
      }
      console.error('Error submitting computer item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET all computer items
computersRouter.get("/", async (req, res) => {
  try {
    const items = await Computers.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching computer items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single computer item
computersRouter.get("/:id", async (req, res) => {
  try {
    const item = await Computers.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching computer item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multer error handler
computersRouter.use((error, req, res, next) => {
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

module.exports = computersRouter;
