const express = require('express');
const router = express.Router();


const User = require('../models/User');

// Add to wishlist (persistent in DB)
router.post('/add', async (req, res) => {
  const { userId, itemId, modelName } = req.body;
  if (!userId || !itemId || !modelName) {
    return res.json({ success: false, error: 'Missing info' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, error: 'User not found' });

    // Prevent duplicates
    if (!user.wishlist.map(String).includes(itemId)) {
      user.wishlist.push(itemId);
      user.wishlistModel.push(modelName);
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: 'DB error' });
  }
});

// Remove from wishlist (persistent in DB)
router.post('/remove', async (req, res) => {
  const { userId, itemId, modelName } = req.body;
  if (!userId || !itemId || !modelName) {
    return res.json({ success: false, error: 'Missing info' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, error: 'User not found' });

    // Remove itemId and modelName at the same index
    const idx = user.wishlist.map(String).indexOf(itemId);
    if (idx !== -1 && user.wishlistModel[idx] === modelName) {
      user.wishlist.splice(idx, 1);
      user.wishlistModel.splice(idx, 1);
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: 'DB error' });
  }
});

// Get wishlist for user (populate item details)
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).lean();
    if (!user) return res.json({ success: false, error: 'User not found' });

    const items = [];
    for (let i = 0; i < (user.wishlist || []).length; i++) {
      const itemId = user.wishlist[i];
      const modelName = user.wishlistModel[i];
      if (!itemId || !modelName) continue;

      // Build model path and require dynamically
      let modelPath = null;
      let model = null;
      try {
        // Map modelName to correct folder and file
        // Adjust this mapping as per your folder structure
        const modelMap = {
          // Electronics
          ac: '../models/Electronics/ac',
          accessories: '../models/Electronics/accessories',
          cameras: '../models/Electronics/cameras',
          computers: '../models/Electronics/computers',
          fridge: '../models/Electronics/fridge',
          games: '../models/Electronics/games',
          kitchen: '../models/Electronics/kitchen',
          tv: '../models/Electronics/tv',
          washing: '../models/Electronics/washing',
          // Fashion
          kids: '../models/Fashion/kids',
          men: '../models/Fashion/men',
          women: '../models/Fashion/women',
          // Furniture
          beds: '../models/Furniture/beds',
          decor: '../models/Furniture/decor',
          'kids-furniture': '../models/Furniture/kids-furniture',
          others: '../models/Furniture/others',
          sofa: '../models/Furniture/sofa',
          // Mobilees
          mobileAccessories: '../models/Mobilees/mobileAccessories',
          mobiles: '../models/Mobilees/mobiles',
          tablets: '../models/Mobilees/tablets',
          // Pets
          aquarium: '../models/Pets/aquarium',
          'books-sports': '../models/Pets/books-sports',
          'pet-accessories': '../models/Pets/pet-accessories',
          // Property
          homes: '../models/Property/homes',
          lands: '../models/Property/lands',
          office: '../models/Property/office',
          shops: '../models/Property/shops',
          // Spare
          aftermarket: '../models/Spare/aftermarket',
          original: '../models/Spare/original',
          // Vehicles
          bicycles: '../models/Vehicles/bicycles',
          bikes: '../models/Vehicles/bikes',
          cars: '../models/Vehicles/cars',
          'commercial-vehicles': '../models/Vehicles/commericial-vehicles',
          scooters: '../models/Vehicles/scooters',
        };
        modelPath = modelMap[modelName];
        if (!modelPath) continue;
        model = require(modelPath);
      } catch (err) {
        continue; // skip if model not found
      }
      try {
        const item = await model.findById(itemId).lean();
        if (item) {
          item.modelName = modelName;
          items.push(item);
        }
      } catch (err) {
        continue;
      }
    }
    res.json({ success: true, items });
  } catch (err) {
    res.json({ success: false, error: 'DB error' });
  }
});

module.exports = router;
