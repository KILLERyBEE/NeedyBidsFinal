const express = require('express');
const multer = require('multer');
const Office = require('../../models/Property/office');
const { uploadMultipleImagesToSupabase } = require('../../utils/imageUpload');
const { ejsAuthenticate } = require('../../middleware/auth');

const officeRouter = express.Router();
const { sendResultOrRedirect } = require('../../utils/respond');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

const validateOfficeInput = (req, res, next) => {
  const { sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, listingType, area, furnishing, workstations, meetingRooms, floor, parking, description } = req.body;
  if (!sellerName || !contactNumber || !email || !pincode || !city || !state || !auctionType || basePrice === undefined || !auctionDuration || !adTitle || !listingType || area === undefined || !furnishing || workstations === undefined || !floor || !parking) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  if (basePrice < 0 || area < 0 || workstations < 0) {
    return res.status(400).json({ error: 'Base price, area, and workstations must be non-negative' });
  }
  if (!['No Reserve', 'Reserve'].includes(auctionType)) {
    return res.status(400).json({ error: 'Invalid auction type' });
  }
  if (!['1 day', '3 days', '7 days', '15 days'].includes(auctionDuration)) {
    return res.status(400).json({ error: 'Invalid auction duration' });
  }
  if (!['Furnished', 'Semi-Furnished', 'Unfurnished'].includes(furnishing)) {
    return res.status(400).json({ error: 'Invalid furnishing' });
  }
  if (!['Yes', 'No'].includes(parking)) {
    return res.status(400).json({ error: 'Invalid parking' });
  }
  if (meetingRooms && !['Yes', 'No'].includes(meetingRooms)) {
    return res.status(400).json({ error: 'Invalid meetingRooms' });
  }
  if (!['Ground Floor','First Flooor','Second Floor','Third Floor','Penthouse'].includes(floor)) {
    return res.status(400).json({ error: 'Invalid floor' });
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

officeRouter.post(
  "/submit",
  ejsAuthenticate,
  upload.array('officePhotos', 5),
  validatePhotos,
  validateOfficeInput,
  async (req, res) => {
    try {
      const username = req.user && req.user.username ? req.user.username : (req.body.username || 'unknown');
      const imageUrls = await uploadMultipleImagesToSupabase(req.files, 'office');
      const { sellerName, contactNumber, email, pincode, city, state, auctionType, basePrice, auctionDuration, adTitle, listingType, area, furnishing, workstations, meetingRooms, floor, parking, description } = req.body;
            // Get username from logged-in user (assumes authentication middleware sets req.user)
     

      const officeItem = new Office({
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
        listingType,
        area,
        furnishing,
        workstations,
        meetingRooms,
        floor,
        parking,
        description,
        photo1: imageUrls[0],
        photo2: imageUrls[1],
        photo3: imageUrls[2],
        photo4: imageUrls[3],
        photo5: imageUrls[4],
  username
      });
  officeItem.userid = req.user && req.user._id;
  await officeItem.save();
  const result = { message: 'Office item submitted successfully!', itemId: officeItem._id };
  return sendResultOrRedirect(req, res, result, '/');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error: ' + error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Duplicate entry found' });
      }
      console.error('Error submitting Office item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

officeRouter.get("/", async (req, res) => {
  try {
    const items = await Office.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching Office items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

officeRouter.get("/:id", async (req, res) => {
  try {
    const item = await Office.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching Office item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

officeRouter.use((error, req, res, next) => {
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

module.exports = officeRouter;
