const express = require('express');
const multer = require('multer');
const Washing = require('../../models/Electronics/washing');
const { uploadMultipleImagesToSupabase } = require('../../utils/imageUpload');
const { ejsAuthenticate } = require('../../middleware/auth');

const washingRouter = express.Router();
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
const validateWashingInput = (req, res, next) => {
  const {
    sellerName, contactNumber, email, pincode, city, state,
    auctionType, basePrice, auctionDuration, adTitle, brand,
    model, machineType, capacity, condition, energyRating, installation, description
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

// POST route for Washing Machine submission
washingRouter.post(
  "/submit",
  ejsAuthenticate,
  upload.array('washingPhotos', 5),
  validatePhotos,
  validateWashingInput,
  async (req, res) => {
    try {
      const username = req.user && req.user.username ? req.user.username : (req.body.username || 'unknown');
      const imageUrls = await uploadMultipleImagesToSupabase(req.files, 'washing');
      const {
        sellerName, contactNumber, email, pincode, city, state,
        auctionType, basePrice, auctionDuration, adTitle, brand,
        model, machineType, capacity, condition, energyRating, installation, description
      } = req.body;

      const washingItem = new Washing({
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
        brand,
        model,
        machineType,
        capacity,
        condition,
        energyRating,
        installation,
        description,
        photo1: imageUrls[0],
        photo2: imageUrls[1],
        photo3: imageUrls[2],
        photo4: imageUrls[3],
        photo5: imageUrls[4],
        username
      });

  washingItem.userid = req.user && req.user._id;
  await washingItem.save();
  const result = { message: 'Washing Machine item submitted successfully!', itemId: washingItem._id };
  return sendResultOrRedirect(req, res, result, '/');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error: ' + error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Duplicate entry found' });
      }
      console.error('Error submitting Washing Machine item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET all Washing Machine items
washingRouter.get("/", async (req, res) => {
  try {
    const items = await Washing.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching Washing Machine items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single Washing Machine item
washingRouter.get("/:id", async (req, res) => {
  try {
    const item = await Washing.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching Washing Machine item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multer error handler
washingRouter.use((error, req, res, next) => {
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

module.exports = washingRouter;
