const mongoose = require('mongoose');

const scooterSchema = new mongoose.Schema({
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
  year: {
    type: Number,
    required: true,
    min: 1980,
    max: new Date().getFullYear()
  },
  kmDriven: {
    type: Number,
    required: true,
    min: 0
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['Petrol', 'Electric', 'Hybrid']
  },
  owners: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4+']
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

module.exports = mongoose.model('Scooter', scooterSchema);