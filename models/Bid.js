const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  category: { type: String, required: true },
  bidAmount: { type: Number, required: true },
  bidTime: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'outbid', 'won', 'lost'], default: 'active' }
});

module.exports = mongoose.model('Bid', bidSchema);
