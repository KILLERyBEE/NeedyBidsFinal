const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const { authenticateToken } = require('../middleware/auth');

// Get all bids for the logged-in user
router.get('/my-bids', authenticateToken, async (req, res) => {
  try {
    const bids = await Bid.find({ user: req.user._id }).sort({ datetime: -1 });
    res.json({ success: true, bids });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching bids' });
  }
});

module.exports = router;
