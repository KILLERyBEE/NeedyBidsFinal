const mongoose = require('mongoose');

const bedsSchema = new mongoose.Schema({
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
    min: 1,
    max: 30
  },
  adTitle: {
    type: String,
    required: true,
    trim: true
  },
  furnitureType:
  {
    type: String,
    required: true,
    enum:['Single Bed', 'Double Bed', 'King Size Bed', 'Queen Size Bed', 'Bunk Bed', 'Sofa Bed','Wardrobe','Cupboard', 'Dressing Table', 'Storage Unit', 'Other'],
  },
  material:
  {
    type: String,
    required: true,
  },
  size:
  {
    type:String,
    required:true,
  },
  condition: {
    type: String,
    required: true,
    enum: ['New','Used'],
  },
  storage:
  {
    type: String,
  },
  assembly:
  {
    type: String,
    enum: ['Assembled','Flat Pack', 'Partially Assembled']
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

module.exports = mongoose.model('Beds', bedsSchema);
