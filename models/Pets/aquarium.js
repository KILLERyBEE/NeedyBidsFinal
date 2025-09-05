const mongoose = require('mongoose');

const aquariumSchema = new mongoose.Schema({
  sellerName: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  auctionType: {
    type: String,
    required: true,
    enum: ['No Reserve', 'Reserve']
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  auctionDuration: {
    type: String,
    required: true,
    enum: ['1 day', '3 days', '7 days', '15 days']
  },
  itemTitle: {
    type: String,
    trim: true
  },
  desription: {
    type: String,
    trim: true
  },
  photo1: {
    type: String,
    required: true,
    trim: true
  },
  photo2: {
    type: String,
    required: true,
    trim: true
  },
  photo3: {
    type: String,
    required: true,
    trim: true
  },
  photo4: {
    type: String,
    required: true,
    trim: true
  },
  photo5: {
    type: String,
    required: true,
    trim: true
  },
  username:
  {
    type: String,
    required: true,
    trim: true
  },
  userid:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Aquarium', aquariumSchema);