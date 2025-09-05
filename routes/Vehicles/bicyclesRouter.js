const express = require('express');
const multer = require('multer');
const Bicycles = require('../../models/Vehicles/bicycles');
const { uploadMultipleImagesToSupabase } = require('../../utils/imageUpload');
const { ejsAuthenticate } = require('../../middleware/auth');
const { sendResultOrRedirect } = require('../../utils/respond');

const bicyclesRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

const validateBicyclesInput = (req, res, next) => {
  const { sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, brand, type, frameSize, condition, price } = req.body;
  if (!sellerName || !contactNumber || !email || !pincode || !city || !state || !auctionType || basePrice === undefined || !auctionDuration || !adTitle || !brand || !type || !frameSize || !condition || price === undefined) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  if (!['No Reserve', 'Reserve'].includes(auctionType)) {
    return res.status(400).json({ error: 'Invalid auction type' });
  }
  if (!['1 day', '3 days', '7 days', '15 days'].includes(auctionDuration)) {
    return res.status(400).json({ error: 'Invalid auction duration' });
  }
  if (!['New', 'Used'].includes(condition)) {
    return res.status(400).json({ error: 'Invalid condition' });
  }
  if (basePrice < 0 || price < 0) {
    return res.status(400).json({ error: 'Base price and price must be non-negative' });
  }
  next();
};

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

bicyclesRouter.post(
  "/submit",
  ejsAuthenticate,
  upload.array('bicyclesPhotos', 5),
  validatePhotos,
  validateBicyclesInput,
  async (req, res) => {
    try {
      const username = req.user && req.user.username ? req.user.username : (req.body.username || 'unknown');
      const imageUrls = await uploadMultipleImagesToSupabase(req.files, 'bicycles');
      const {
        sellerName, contactNumber, email, pincode, city, state,
        auctionType, basePrice, auctionDuration, adTitle, brand, type, frameSize, condition, price, description
      } = req.body;
            // Get username from logged-in user (assumes authentication middleware sets req.user)
     

  const bicyclesItem = new Bicycles({
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
        type,
        frameSize,
        condition,
        price,
        description,
        photo1: imageUrls[0],
        photo2: imageUrls[1],
        photo3: imageUrls[2],
        photo4: imageUrls[3],
        photo5: imageUrls[4],
        username
  });
  bicyclesItem.userid = req.user && req.user._id;
  await bicyclesItem.save();
  const result = { message: 'Bicycles item submitted successfully!', itemId: bicyclesItem._id };
  return sendResultOrRedirect(req, res, result, '/');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error: ' + error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Duplicate entry found' });
      }
      console.error('Error submitting Bicycles item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

bicyclesRouter.get("/", async (req, res) => {
  try {
    const items = await Bicycles.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching Bicycles items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

bicyclesRouter.get("/:id", async (req, res) => {
  try {
    const item = await Bicycles.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching Bicycles item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

bicyclesRouter.use((error, req, res, next) => {
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

module.exports = bicyclesRouter;
