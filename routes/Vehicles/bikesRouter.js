const express = require('express');
const multer = require('multer');
const Bike = require('../../models/Vehicles/bikes');
const { ejsAuthenticate } = require('../../middleware/auth');
const { sendResultOrRedirect } = require('../../utils/respond');

const { uploadMultipleImagesToSupabase } = require('../../utils/imageUpload');

const bikesRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

const validateBikesInput = (req, res, next) => {
  const { sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, brand, model, year, kmDriven, fuelType, owners, condition, description } = req.body;
  if (!sellerName || !contactNumber || !email || !pincode || !city || !state || !auctionType || basePrice === undefined || !auctionDuration || !adTitle || !brand || !model || year === undefined || kmDriven === undefined || !fuelType || !owners || !condition) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  if (!['No Reserve', 'Reserve'].includes(auctionType)) {
    return res.status(400).json({ error: 'Invalid auction type' });
  }
  if (!['1 day', '3 days', '7 days', '15 days'].includes(auctionDuration)) {
    return res.status(400).json({ error: 'Invalid auction duration' });
  }
  if (!['Petrol', 'Diesel', 'Electric', 'Hybrid'].includes(fuelType)) {
    return res.status(400).json({ error: 'Invalid fuel type' });
  }
  if (!['1', '2', '3', '4+'].includes(owners)) {
    return res.status(400).json({ error: 'Invalid owners' });
  }
  if (!['New', 'Used'].includes(condition)) {
    return res.status(400).json({ error: 'Invalid condition' });
  }
  if (basePrice < 0 || kmDriven < 0) {
    return res.status(400).json({ error: 'Base price and kmDriven must be non-negative' });
  }
  const currentYear = new Date().getFullYear();
  if (year < 1980 || year > currentYear) {
    return res.status(400).json({ error: 'Invalid year' });
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

bikesRouter.post(
  "/submit",
  ejsAuthenticate,
  upload.array('bikesPhotos', 5),
  validatePhotos,
  validateBikesInput,
  async (req, res) => {
    try {
      const username = req.user && req.user.username ? req.user.username : (req.body.username || 'unknown');
      const imageUrls = await uploadMultipleImagesToSupabase(req.files, 'bikes');
      const {
        sellerName, contactNumber, email, pincode, city, state,
        auctionType, basePrice, auctionDuration, adTitle, brand, model, year, kmDriven, fuelType, owners, condition, description
      } = req.body;

  const bikesItem = new Bike({
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
        year,
        kmDriven,
        fuelType,
        owners,
        condition,
        description,
        photo1: imageUrls[0],
        photo2: imageUrls[1],
        photo3: imageUrls[2],
        photo4: imageUrls[3],
        photo5: imageUrls[4],
        username
  });
  bikesItem.userid = req.user && req.user._id;
  await bikesItem.save();
  const result = { message: 'Bikes item submitted successfully!', itemId: bikesItem._id };
  return sendResultOrRedirect(req, res, result, '/');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error: ' + error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Duplicate entry found' });
      }
      console.error('Error submitting Bikes item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

bikesRouter.get("/", async (req, res) => {
  try {
    const items = await Bike.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching Bikes items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

bikesRouter.get("/:id", async (req, res) => {
  try {
    const item = await Bike.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching Bikes item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

bikesRouter.use((error, req, res, next) => {
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

module.exports = bikesRouter;
