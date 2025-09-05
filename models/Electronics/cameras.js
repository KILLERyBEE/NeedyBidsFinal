const mongoose = require('mongoose');

const camerasSchema = new mongoose.Schema({
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
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  auctionDuration: {
    type: String,
    required: true,
  },
  adTitle: {
    type: String,
    required: true,
    trim: true
  },
  equipmentType: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    trim: true
  },
  shutterCount: {
    type: String,
    trim: true
  },
  sensorResolution: {
    type: String,
    trim: true
  },
  lensMount: {
    type: String,
    trim: true
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

module.exports = mongoose.model('Cameras', camerasSchema);
