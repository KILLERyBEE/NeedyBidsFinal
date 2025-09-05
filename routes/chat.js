const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { authenticateToken } = require('../middleware/auth');

// Get users with whom the current user has a chat (by userId)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ username: req.user.username });
    if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });
    const chats = await Chat.find({ users: currentUser._id });
    // Get other userIds from chats
    const userIds = chats
      .map(chat => chat.users.find(u => u.toString() !== currentUser._id.toString()))
      .filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }, 'username profilePicture');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Send a chat request (start a chat if not exists)
router.post('/request/:username', authenticateToken, async (req, res) => {
  const currentUser = await User.findOne({ username: req.user.username });
  const otherUser = await User.findOne({ username: req.params.username });
  if (!currentUser || !otherUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (currentUser._id.equals(otherUser._id)) {
    return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
  }
  let chat = await Chat.findOne({ users: { $all: [currentUser._id, otherUser._id] } });
  if (!chat) {
    chat = new Chat({ users: [currentUser._id, otherUser._id], messages: [] });
    await chat.save();
  }
  res.json({ success: true });
});

// Get messages between current user and another user
router.get('/messages/:username', authenticateToken, async (req, res) => {
  const currentUser = await User.findOne({ username: req.user.username });
  const otherUser = await User.findOne({ username: req.params.username });
  if (!currentUser || !otherUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const chat = await Chat.findOne({ users: { $all: [currentUser._id, otherUser._id] } }).populate('messages.sender', 'username profilePicture');
  // Populate sender info for each message
  const messages = chat ? chat.messages.map(msg => ({
    _id: msg._id,
    sender: msg.sender,
    text: msg.text,
    time: msg.time,
    senderUsername: msg.sender.username,
    senderProfilePicture: msg.sender.profilePicture
  })) : [];
  res.json({ success: true, messages });
});

// Send a message
router.post('/messages/:username', authenticateToken, async (req, res) => {
  const currentUser = await User.findOne({ username: req.user.username });
  const otherUser = await User.findOne({ username: req.params.username });
  const { text } = req.body;
  if (!currentUser || !otherUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  let chat = await Chat.findOne({ users: { $all: [currentUser._id, otherUser._id] } });
  if (!chat) {
    chat = new Chat({ users: [currentUser._id, otherUser._id], messages: [] });
  }
  chat.messages.push({ sender: currentUser._id, text });
  await chat.save();
  res.json({ success: true });
});

// Route to start chat with a specific user
router.get('/:username', async (req, res) => {
  try {
    // Check if user is authenticated
    let token;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // Redirect to login if not authenticated
      return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.userId).select('-password');
    
    if (!currentUser) {
      return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    const otherUser = await User.findOne({ username: req.params.username });
    
    if (!otherUser) {
      return res.status(404).render('error', { 
        message: 'User not found',
        user: currentUser,
        isAuthenticated: true 
      });
    }
    
    if (currentUser._id.equals(otherUser._id)) {
      return res.status(400).render('error', { 
        message: 'Cannot chat with yourself',
        user: currentUser,
        isAuthenticated: true 
      });
    }
    
    // Find or create chat
    let chat = await Chat.findOne({ users: { $all: [currentUser._id, otherUser._id] } });
    if (!chat) {
      chat = new Chat({ users: [currentUser._id, otherUser._id], messages: [] });
      await chat.save();
    }
    
    // Render the chat page
    res.render('chat', {
      user: currentUser,
      otherUser: otherUser,
      isAuthenticated: true
    });
    
  } catch (error) {
    console.error('Error starting chat:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    res.status(500).render('error', { 
      message: 'Internal server error',
      user: null,
      isAuthenticated: false 
    });
  }
});

module.exports = router;
