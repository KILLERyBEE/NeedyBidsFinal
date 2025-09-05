

const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();
const User = require('../models/User');
const Bid = require('../models/Bid');

// Import all models to handle different item types
const Cars = require('../models/Vehicles/cars');
const Bikes = require('../models/Vehicles/bikes');
const Scooters = require('../models/Vehicles/scooters');
const Bicycles = require('../models/Vehicles/bicycles');
const CommercialVehicles = require('../models/Vehicles/commericial-vehicles');
const Mobiles = require('../models/Mobilees/mobiles');
const Tablets = require('../models/Mobilees/tablets');
const MobileAccessories = require('../models/Mobilees/mobileAccessories');
const Homes = require('../models/Property/homes');
const Lands = require('../models/Property/lands');
const Shops = require('../models/Property/shops');
const Office = require('../models/Property/office');
const TV = require('../models/Electronics/tv');
const Kitchen = require('../models/Electronics/kitchen');
const Computers = require('../models/Electronics/computers');
const Cameras = require('../models/Electronics/cameras');
const Fridge = require('../models/Electronics/fridge');
const Accessories = require('../models/Electronics/accessories');
const Games = require('../models/Electronics/games');
const Washing = require('../models/Electronics/washing');
const AC = require('../models/Electronics/ac');
const Sofa = require('../models/Furniture/sofa');
const Beds = require('../models/Furniture/beds');
const Decor = require('../models/Furniture/decor');
const KidsFurniture = require('../models/Furniture/kids-furniture');
const Others = require('../models/Furniture/others');
const Men = require('../models/Fashion/men');
const Women = require('../models/Fashion/women');
const Kids = require('../models/Fashion/kids');
const Aquarium = require('../models/Pets/aquarium');
const PetAccessories = require('../models/Pets/pet-accessories');
const BooksSports = require('../models/Pets/books-sports');
const Original = require('../models/Spare/original');
const Aftermarket = require('../models/Spare/aftermarket');

// Create a mapping of model names to their corresponding models
const modelMap = {
  'cars': Cars,
  'bikes': Bikes,
  'scooters': Scooters,
  'bicycles': Bicycles,
  'commercial-vehicles': CommercialVehicles,
  'mobiles': Mobiles,
  'tablets': Tablets,
  'mobile-accessories': MobileAccessories,
  'homes': Homes,
  'lands': Lands,
  'shops': Shops,
  'office': Office,
  'tv': TV,
  'kitchen': Kitchen,
  'computers': Computers,
  'cameras': Cameras,
  'fridge': Fridge,
  'accessories': Accessories,
  'games': Games,
  'washing': Washing,
  'ac': AC,
  'sofa': Sofa,
  'beds': Beds,
  'decor': Decor,
  'kids-furniture': KidsFurniture,
  'others': Others,
  'men': Men,
  'women': Women,
  'kids': Kids,
  'aquarium': Aquarium,
  'pet-accessories': PetAccessories,
  'books-sports': BooksSports,
  'original': Original,
  'aftermarket': Aftermarket
};

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Item data route is working!' });
});


// API to get ending soon items for a category
router.get('/:category/ending-soon', async (req, res) => {
  try {
    const { category } = req.params;
    const Model = modelMap[category];
    if (!Model) return res.status(404).json({ success: false, message: 'Category not found' });
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Assuming item has createdAt and auctionDuration (e.g., '2 days')
    const items = await Model.find({
      createdAt: { $lte: now },
      // Filter items whose auction ends in next 24h
    }).lean();
    // Calculate end time and filter
    const endingSoon = items.filter(item => {
      const durationDays = parseInt(item.auctionDuration?.split(' ')[0] || '0');
      const endTime = new Date(new Date(item.createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000);
      return endTime > now && endTime <= next24h;
    });
    res.json({ success: true, items: endingSoon });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching ending soon items' });
  }
});
router.get('/:category/:id/bid-history', async (req, res) => {
  try {
    const { category, id } = req.params;
    const bids = await require('../models/Bid').find({ itemId: id, category })
      .sort({ bidTime: -1 })
      .populate('user', 'username profilePicture')
      .lean();
    res.json({ success: true, bids });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching bid history' });
  }
});
// Route to display item details
router.get('/:category/:id', optionalAuth, async (req, res) => {
  try {
    const { category, id } = req.params;
    const Model = modelMap[category];
    if (!Model) {
      return res.status(404).render('error', {
        message: 'Category not found',
        user: req.user || null,
        isAuthenticated: !!req.user
      });
    }

    // Find the item by ID
    const item = await Model.findById(id);
    if (!item) {
      return res.status(404).render('error', {
        message: 'Item not found',
        user: req.user || null,
        isAuthenticated: !!req.user
      });
    }

    // Helper to compute time remaining
    const calculateTimeRemaining = (createdAt, auctionDuration) => {
      if (!createdAt || !auctionDuration) return '';
      const startTime = new Date(createdAt);
      const durationInDays = parseInt(auctionDuration.split(' ')[0]) || 0;
      const endTime = new Date(startTime.getTime() + (durationInDays * 24 * 60 * 60 * 1000));
      const now = new Date();
      if (now >= endTime) return 'Auction ended';
      const timeLeft = endTime - now;
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Try to find ending-soon items in same category (exclude current)
    const sameCategoryItems = await Model.find({ _id: { $ne: id }, createdAt: { $lte: now } }).lean();
    let endingSoonItems = sameCategoryItems.filter(otherItem => {
      const durationDays = parseInt(otherItem.auctionDuration?.split(' ')[0] || '0');
      const endTime = new Date(new Date(otherItem.createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000);
      return endTime > now && endTime <= next24h;
    });

    // If none found in same category, fallback to random items across all categories
    if (!endingSoonItems || endingSoonItems.length === 0) {
      let allOtherItems = [];
      for (const [cat, ModelX] of Object.entries(modelMap)) {
        if (!ModelX) continue;
        const items = await ModelX.find({ _id: { $ne: id }, createdAt: { $lte: now } }).lean();
        // keep only items whose auction hasn't ended
        const valid = items.filter(it => {
          const durationDays = parseInt(it.auctionDuration?.split(' ')[0] || '0');
          const endTime = new Date(new Date(it.createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000);
          return endTime > now;
        });
  // annotate each item with its model/category name so the frontend can link correctly
  const annotated = valid.map(v => ({ ...v, modelName: cat }));
  allOtherItems = allOtherItems.concat(annotated);
      }
      endingSoonItems = allOtherItems.sort(() => Math.random() - 0.5).slice(0, 3);
    } else {
      // limit to 3 if more
      endingSoonItems = endingSoonItems.slice(0, 3);
    }

    // Get existing bids for this item to determine highest bid
    const existingBids = await Bid.find({ itemId: id, category: category }).sort({ bidAmount: -1 }).limit(1);
    const highestBid = existingBids.length > 0 ? existingBids[0].bidAmount : item.basePrice;
    const nextBidAmount = highestBid + 1000;

    // Fetch seller information if available
    let seller = null;
    if (item.userid) {
      seller = await User.findById(item.userid).select('username profilePicture about');
    }

    // Format the main item data
    const formattedItem = {
      ...item.toObject(),
      timeRemaining: calculateTimeRemaining(item.createdAt, item.auctionDuration),
      highestBid,
      bidCount: existingBids.length,
      nextBidAmount,
      seller
    };

  // Format ending soon items for template and filter out any already-ended
  const formattedEndingSoonItems = (endingSoonItems || []).map(it => {
      const obj = it.toObject ? it.toObject() : it;
      return {
  modelName: obj.modelName || category,
        _id: obj._id,
        photo1: obj.photo1 || '',
        adTitle: obj.adTitle || obj.model || obj.title || 'Item',
        model: obj.model || '',
        auctionType: obj.auctionType || 'No Reserve',
        description: obj.description || '',
        city: obj.city || '',
        state: obj.state || '',
        basePrice: obj.basePrice || 0,
        auctionDuration: obj.auctionDuration || '',
        createdAt: obj.createdAt && obj.createdAt.toISOString ? obj.createdAt.toISOString() : obj.createdAt,
        // Precompute end time ISO to make client countdown reliable
        endTimeISO: (function(){
          try {
            if (!obj.createdAt || !obj.auctionDuration) return '';
            // reuse calculateTimeRemaining logic: parse days if possible
            const start = new Date(obj.createdAt);
            let durationDays = parseInt(String(obj.auctionDuration).split(' ')[0]) || 0;
            const end = new Date(start.getTime() + (durationDays * 24 * 60 * 60 * 1000));
            return end.toISOString();
          } catch(e) { return ''; }
        })(),
        timeRemaining: obj.createdAt && obj.auctionDuration ? calculateTimeRemaining(obj.createdAt, obj.auctionDuration) : '',
      };
  }).filter(fi => fi.timeRemaining && fi.timeRemaining !== 'Auction ended');

  // debug log removed

    return res.render('item-data', {
      item: formattedItem,
      endingSoonItems: formattedEndingSoonItems,
      user: req.user || null,
      isAuthenticated: !!req.user,
      category: category
    });

  } catch (error) {
    console.error('Error fetching item details:', error);
    return res.status(500).render('error', {
      message: 'Internal server error',
      user: req.user || null,
      isAuthenticated: !!req.user
    });
  }
});

// Route to submit a bid
router.post('/:category/:id/bid', optionalAuth, async (req, res) => {
  try {
    const { category, id } = req.params;
    const { bidAmount } = req.body;
    
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please login to place a bid' });
    }

    // Get the appropriate model based on category
    const Model = modelMap[category];
    
    if (!Model) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Find the item by ID
    const item = await Model.findById(id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Check if user is not bidding on their own item
    if (item.userid && item.userid.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot bid on your own item' });
    }

    // Get existing highest bid
    const existingBids = await Bid.find({ 
      itemId: id,
      category: category 
    }).sort({ bidAmount: -1 }).limit(1);

    const currentHighestBid = existingBids.length > 0 ? existingBids[0].bidAmount : item.basePrice;

    // Validate bid amount
    if (bidAmount <= currentHighestBid) {
      return res.status(400).json({ 
        success: false, 
        message: `Bid must be higher than current highest bid (₹${currentHighestBid.toLocaleString('en-IN')})` 
      });
    }

    // Create new bid
    const newBid = new Bid({
      user: req.user._id,
      itemId: id,
      category: category,
      bidAmount: bidAmount
    });


    await newBid.save();

    // Emit socket event for live bid history
    try {
      const io = req.app.get('io');
      const populatedBid = await Bid.findById(newBid._id).populate('user', 'username profilePicture').lean();
      io.to(`item_${id}`).emit('newBid', populatedBid);
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr);
    }

    // Record activity for the bid
    try {
      const Activity = require('../models/Activity');
      await Activity.create({
        user: req.user._id,
        type: 'bid',
        action: 'placed bid',
        itemId: id,
        category: category,
        amount: bidAmount,
        itemTitle: item.title || item.carname || item.name || 'Item',
        location: req.body.userDistrict || item.location || '-',
        meta: { bidId: newBid._id }
      });
    } catch (actErr) {
      console.error('Failed to create activity entry:', actErr);
    }

    // Update status of previous highest bid to 'outbid'
    if (existingBids.length > 0) {
      await Bid.findByIdAndUpdate(existingBids[0]._id, { status: 'outbid' });
    }

    res.json({ 
      success: true, 
      message: 'Bid placed successfully!',
      newHighestBid: bidAmount
    });

  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;