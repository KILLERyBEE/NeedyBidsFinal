const mongoose = require('mongoose');

const sofaSchema = new mongoose.Schema({
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
  furnitureType: {
    type: String,
    required: true,
    enum: [
      'Sofa', 'Dining Table', 'Dining Chairs', 'Sofa Set', 'Dining Set',
      'Recliner', 'Bar Stools', 'Other'
    ]
  },
  material: {
    type: String,
    required: true,
    enum: [
      'Wood', 'Metal', 'Fabric', 'Leather', 'Glass',
      'Plastic', 'Cane/Rattan', 'Marble', 'Other'
    ]
  },
  seatingCapacity: {
    type: String,
    enum: [
      '2-Seater', '3-Seater', '4-Seater', '5-Seater',
      '6-Seater', '8-Seater', '10-Seater+'
    ]
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Used']
  },
  color: {
    type: String,
    trim: true
  },
  style: {
    type: String,
    enum: [
      'Modern', 'Contemporary', 'Traditional', 'Minimalist',
      'Industrial', 'Scandinavian', 'Bohemian', 'Other'
    ]
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

module.exports = mongoose.model('Sofa', sofaSchema);