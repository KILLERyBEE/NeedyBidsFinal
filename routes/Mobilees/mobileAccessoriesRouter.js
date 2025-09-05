const express = require('express');
const multer = require('multer');
const MobileAccessory = require('../../models/Mobilees/mobileAccessories');
const { uploadMultipleImagesToSupabase } = require('../../utils/imageUpload');
const { ejsAuthenticate } = require('../../middleware/auth');
const { sendResultOrRedirect } = require('../../utils/respond');

const mobileAccessoriesRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

const validateMobileAccessoriesInput = (req, res, next) => {
  const { sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, accessoryType, brand, condition, description } = req.body;
  if (!sellerName || !contactNumber || !email || !pincode || !city || !state || !auctionType || basePrice === undefined || !auctionDuration || !adTitle) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  if (basePrice < 0) {
    return res.status(400).json({ error: 'Base price must be non-negative' });
  }
  if (!['No Reserve', 'Reserve'].includes(auctionType)) {
    return res.status(400).json({ error: 'Invalid auction type' });
  }
  if (!['Charger', 'Cable', 'Case/Cover', 'Earphones', 'Headphones', 'Power Bank', 'Screen Protector', 'Smartwatch', 'Bluetooth Speaker', 'Wireless Charger', 'Stylus', 'VR Headset', 'Other'].includes(accessoryType)) {
    return res.status(400).json({ error: 'Invalid accessory type' });
  }
  if (brand && !['Apple', 'Samsung', 'Xiaomi', 'Realme', 'Sony', 'JBL', 'Boat', 'OnePlus', 'Nothing', 'Oppo', 'Vivo', 'iQOO', 'Infinix', 'Tecno', 'Anker', 'Belkin', 'Amazfit', 'Noise', 'Fire-Boltt', 'Other'].includes(brand)) {
    return res.status(400).json({ error: 'Invalid brand' });
  }
  if (!['New', 'Used'].includes(condition)) {
    return res.status(400).json({ error: 'Invalid condition' });
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

mobileAccessoriesRouter.post(
  "/submit",
  ejsAuthenticate,
  upload.array('mobileAccessoriesPhotos', 5),
  validatePhotos,
  validateMobileAccessoriesInput,
  async (req, res) => {
    try {
      const username = req.user && req.user.username ? req.user.username : (req.body.username || 'unknown');
      const imageUrls = await uploadMultipleImagesToSupabase(req.files, 'mobileAccessories');
      const { sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, accessoryType, brand, condition, description } = req.body;
      // Get username from logged-in user (assumes authentication middleware sets req.user)
      

      const mobileAccessoryItem = new MobileAccessory({
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
        accessoryType,
        brand,
        condition,
        description,
        photo1: imageUrls[0],
        photo2: imageUrls[1],
        photo3: imageUrls[2],
        photo4: imageUrls[3],
        photo5: imageUrls[4],
        username
  });
  mobileAccessoryItem.userid = req.user && req.user._id;
  await mobileAccessoryItem.save();
  const result = { message: 'Mobile Accessories item submitted successfully!', itemId: mobileAccessoryItem._id };
  return sendResultOrRedirect(req, res, result, '/');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error: ' + error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Duplicate entry found' });
      }
      console.error('Error submitting Mobile Accessories item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

mobileAccessoriesRouter.get("/", async (req, res) => {
  try {
    const items = await MobileAccessory.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching Mobile Accessories items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

mobileAccessoriesRouter.get("/:id", async (req, res) => {
  try {
    const item = await MobileAccessory.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching Mobile Accessories item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

mobileAccessoriesRouter.use((error, req, res, next) => {
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

module.exports = mobileAccessoriesRouter;
