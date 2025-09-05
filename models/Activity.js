const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['bid', 'listing', 'message', 'system'], default: 'bid' },
  action: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: false },
  category: { type: String, default: null },
  amount: { type: Number, default: null },
  itemTitle: { type: String, default: null },
  location: { type: String, default: null },
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
