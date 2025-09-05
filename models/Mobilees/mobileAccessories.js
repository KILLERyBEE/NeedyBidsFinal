const mongoose = require('mongoose');

const mobileAccessorySchema = new mongoose.Schema({
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
  },
  adTitle: {
    type: String,
    required: true,
    trim: true
  },
  accessoryType: {
    type: String,
    required: true,
    enum: ['Charger', 'Cable', 'Case/Cover', 'Earphones', 'Headphones', 'Power Bank', 'Screen Protector', 'Smartwatch', 'Bluetooth Speaker', 'Wireless Charger', 'Stylus', 'VR Headset', 'Other']
  },
  brand: {
    type: String,
    enum: ['Apple', 'Samsung', 'Xiaomi', 'Realme', 'Sony', 'JBL', 'Boat', 'OnePlus', 'Nothing', 'Oppo', 'Vivo', 'iQOO', 'Infinix', 'Tecno', 'Anker', 'Belkin', 'Amazfit', 'Noise', 'Fire-Boltt', 'Other']
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

module.exports = mongoose.model('MobileAccessory', mobileAccessorySchema);
