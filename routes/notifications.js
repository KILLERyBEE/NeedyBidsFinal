const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Bid = require('../models/Bid');

// Import models used in auctions (same map as item-data.js)
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

// Helper to compute endTime from createdAt + auctionDuration string like '3 days'
function computeEndTime(item) {
  if (!item || !item.createdAt || !item.auctionDuration) return null;
  const days = parseInt(String(item.auctionDuration).split(' ')[0]) || 0;
  return new Date(new Date(item.createdAt).getTime() + days * 24 * 60 * 60 * 1000);
}

// GET /api/notifications - return "you won" notifications for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Find distinct item/category pairs where the user placed bids
    const userBids = await Bid.find({ user: userId }).lean();
    const unique = {};
    userBids.forEach(b => {
      unique[`${b.category}::${b.itemId}`] = true;
    });

    const notifications = [];
    const now = new Date();

    for (const key of Object.keys(unique)) {
      const [category, itemId] = key.split('::');
      const Model = modelMap[category];
      if (!Model) continue;

      const item = await Model.findById(itemId).lean();
      if (!item) continue;

      const endTime = computeEndTime(item);
      if (!endTime) continue;
      // only consider ended auctions
      if (now < endTime) continue;

      // get highest bid for this item
      const highest = await Bid.find({ itemId: item._id, category }).sort({ bidAmount: -1 }).limit(1).lean();
      if (!highest || highest.length === 0) continue;
      const top = highest[0];
      if (!top.user) continue;

      if (top.user.toString() === userId) {
        const title = item.adTitle || item.title || item.model || item.carname || item.name || 'Item';
        notifications.push({
          type: 'won',
          itemId: item._id,
          category,
          title,
          amount: top.bidAmount,
          time: top.bidTime || top._id.getTimestamp()
        });
      }
    }

    // sort by time desc
    notifications.sort((a,b) => new Date(b.time) - new Date(a.time));
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
