const mongoose = require('mongoose');


const chatSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // userIds
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // userId
    text: String,
    time: { type: Date, default: Date.now }
  }],
});

module.exports = mongoose.model('Chat', chatSchema);
