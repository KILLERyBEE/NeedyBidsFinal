const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { authenticateToken } = require('../middleware/auth');

// Get activities for logged in user
router.get('/my-activities', authenticateToken, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, activities });
  } catch (err) {
    console.error('Error fetching activities', err);
    res.status(500).json({ success: false, message: 'Error fetching activities' });
  }
});

module.exports = router;
