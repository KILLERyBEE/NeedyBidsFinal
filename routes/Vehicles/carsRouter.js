const express = require('express');
const multer = require('multer');
const Cars = require('../../models/Vehicles/cars');
const { uploadMultipleImagesToSupabase } = require('../../utils/imageUpload');
const { sendResultOrRedirect } = require('../../utils/respond');
const { ejsAuthenticate } = require('../../middleware/auth');

const carsRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

const validateCarsInput = (req, res, next) => {
  const { sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, brand, model, year, fuelType, transmission, kmDriven, owners, condition, description } = req.body;
  if (!sellerName || !contactNumber || !email || !pincode || !city || !state || !auctionType || basePrice === undefined || !auctionDuration || !adTitle || !brand || !model || year === undefined || !fuelType || !transmission || kmDriven === undefined || !owners || !condition) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  if (!['No Reserve', 'Reserve'].includes(auctionType)) {
    return res.status(400).json({ error: 'Invalid auction type' });
  }
  if (!['1 day', '3 days', '7 days', '15 days'].includes(auctionDuration)) {
    return res.status(400).json({ error: 'Invalid auction duration' });
  }
  if (!['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].includes(fuelType)) {
    return res.status(400).json({ error: 'Invalid fuel type' });
  }
  if (!['Manual', 'Automatic'].includes(transmission)) {
    return res.status(400).json({ error: 'Invalid transmission' });
  }
  if (basePrice < 0 || kmDriven < 0) {
    return res.status(400).json({ error: 'Base price and kmDriven must be non-negative' });
  }
  const currentYear = new Date().getFullYear();
  if (year < 1980 || year > currentYear) {
    return res.status(400).json({ error: 'Invalid year' });
  }
  if (!['New', 'Used'].includes(condition)) {
    return res.status(400).json({ error: 'Invalid condition' });
  }
  next();
};
carsRouter.post(
  "/submit",
  ejsAuthenticate,
  upload.array('carsPhotos', 5),
  validateCarsInput,
  async (req, res) => {
    try {
      // Get username from logged-in user (assumes authentication middleware sets req.user)
      const username = req.user && req.user.username ? req.user.username : (req.body.username || 'unknown');
      const imageUrls = await uploadMultipleImagesToSupabase(req.files, 'cars');
      const {
        sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, brand, model, year, fuelType, transmission, kmDriven, owners, condition, description
      } = req.body;
  // Add username to the item being created
  const carsItem = new Cars({
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
        fuelType,
        transmission,
        kmDriven,
        owners,
  condition,
  description,
  username, // ensure username is saved
  photo1: imageUrls[0],
        photo2: imageUrls[1],
        photo3: imageUrls[2],
        photo4: imageUrls[3],
        photo5: imageUrls[4],
  });
  carsItem.userid = req.user && req.user._id;
  await carsItem.save();
  const result = { message: 'Cars item submitted successfully!', itemId: carsItem._id };
  return sendResultOrRedirect(req, res, result, '/');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error: ' + error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Duplicate entry found' });
      }
      console.error('Error submitting Cars item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

carsRouter.get("/", async (req, res) => {
  try {
    const items = await Cars.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching Cars items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

carsRouter.get("/:id", async (req, res) => {
  try {
    const item = await Cars.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching Cars item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

carsRouter.use((error, req, res, next) => {
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

module.exports = carsRouter;
