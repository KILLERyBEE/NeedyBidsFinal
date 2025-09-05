const mongoose = require('mongoose');

const mobileSchema = new mongoose.Schema({
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
    enum: ['1 Day', '3 Days', '7 Days', '15 Days']
  },
  adTitle: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  storage: {
    type: String,
    required: true,
    enum: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB']
  },
  ram: {
    type: String,
    enum: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB']
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Used']
  },
  description: {
    type: String,
    trim: true
  },
  photo1:
  {
    type: String,
    required: true,
    trim: true
  },
  photo2:
  {
    type: String,
    required: true,
    trim: true
  },
  photo3:
  {
    type: String,
    required: true,
    trim: true
  },
  photo4:
  {
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

module.exports = mongoose.model('Mobile', mobileSchema);
