const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
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
    enum: ['1 day', '3 days', '7 days', '15 days']
  },
  adTitle: {
    type: String,
    trim: true
  },
  listingType: {
    type: String,
    required: true,
  },
  carpetArea: {
    type: Number,
    min: 0
  },
  furnishing: {
    type: String,
    enum: ['Furnished', 'Unfurnished']
  },
  washroom: {
    type: String,
    required: true,
  },
  floor: {
    type: String,
    min: 1
  },
  price: {
    type: Number,
    min: 0
  },
  priceType: {
    type: String,
    enum: ['Fixed', 'Negotiable']
  },
  description: {
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

module.exports = mongoose.model('Shop', shopSchema);