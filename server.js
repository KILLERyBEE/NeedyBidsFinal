const bidsRoutes = require('./routes/bids');
const http = require('http');
const { Server } = require('socket.io');
const chatRoutes = require('./routes/chat');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const db = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config();

const sellerDashboardRouter = require("./routes/sellerDashboardRouter");

console.log('🚀 Starting BidToBuy Backend...');
console.log('📊 Environment:', process.env.NODE_ENV);
console.log('🔗 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');

// Import API routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const subscriptionRoutes = require('./routes/subscription');
const activityRoutes = require('./routes/activity');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);
app.use(cookieParser());
app.use('/api/bids', bidsRoutes);
const PORT = process.env.PORT || 5000;

//Electronics
const acRouter = require("./routes/Electronics/acRouter")
const cameraRouter = require("./routes/Electronics/cameraRouter")
const fridgeRouter = require("./routes/Electronics/fridgeRouter")
const gamesRouter = require("./routes/Electronics/gamesRouter")
const kitchenRouter = require("./routes/Electronics/kitchenRouter")
const tvRouter = require("./routes/Electronics/tvRouter")
const washingRouter = require("./routes/Electronics/washingRouter")
const computersRouter = require("./routes/Electronics/computersRouter")
const accessoriesRouter = require("./routes/Electronics/accessoriesRouter")

//Fashion
const menRouter = require("./routes/Fashion/menRouter")
const womenRouter = require("./routes/Fashion/womenRouter")
const kidsRouter = require("./routes/Fashion/kidsRouter")

//Furniture
const sofaRouter = require("./routes/Furniture/sofaRouter")
const bedsRouter = require("./routes/Furniture/bedsRouter")
const decorRouter = require("./routes/Furniture/decorRouter")
const kidsFurnitureRouter = require("./routes/Furniture/kidsFurnitureRouter")
const othersRouter = require("./routes/Furniture/othersRouter")

//MObiles
const mobilesRouter = require("./routes/Mobilees/mobilesRouter")
const tabletsRouter = require("./routes/Mobilees/tabletsRouter")
const mobileAccessoriesRouter = require("./routes/Mobilees/mobileAccessoriesRouter")

//Pets
const aquariumRouter = require("./routes/Pets/aquariumRouter")
const petAccessoriesRouter = require("./routes/Pets/petAccessoriesRouter")
const booksSportsRouter = require("./routes/Pets/booksSportsRouter")

//Property
const homesRouter = require("./routes/Property/homesRouter")
const landsRouter = require("./routes/Property/landsRouter")
const shopsRouter = require("./routes/Property/shopsRouter")
const officeRouter = require("./routes/Property/officeRouter")

//Spare
const originalRouter = require("./routes/Spare/originalRouter")
const aftermarketRouter = require("./routes/Spare/aftermarketRouter")

//Vehicles
const carsRouter = require("./routes/Vehicles/carsRouter")
const bikesRouter = require("./routes/Vehicles/bikesRouter")
const scootersRouter = require("./routes/Vehicles/scootersRouter")
const bicyclesRouter = require("./routes/Vehicles/bicyclesRouter")
const commercialVehiclesRouter = require("./routes/Vehicles/commercialVehiclesRouter")

// Middleware for parsing request bodies

// Security middleware with custom CSP for development and localtunnel
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://kit.fontawesome.com",
        "https://checkout.razorpay.com"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://ka-f.fontawesome.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://kit.fontawesome.com",
        "https://ka-f.fontawesome.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://192.168.0.178:5000",
        "https://ka-f.fontawesome.com",
        "https://cdn.jsdelivr.net",
        "https://api.postalpincode.in"
      ],
      frameSrc: [
        "'self'"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    }
  }
}));

// CORS configuration - Allow all origins for localtunnel

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
  message: JSON.stringify({ error: 'Too many requests, please try again later.' }),
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for localtunnel
app.set('trust proxy', 1);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Custom DB connection (handled in config/db.js)
console.log('🛰️ Setting up MongoDB connection...');
db.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
  // Server will be started below, not here
});
// Socket.IO logic for real-time chat
io.on('connection', (socket) => {
  // Join a room for a chat between two users (room name: sorted usernames joined by '-')
  socket.on('join', (room) => {
    socket.join(room);
  });
  // Broadcast message to room
  socket.on('send_message', (data) => {
    io.to(data.room).emit('receive_message', data);
  });
});
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
db.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('🔍 Error details:', err);
  process.exit(1);
});


// Middleware to check if user is logged in via JWT in cookies or Authorization header (for EJS pages)
const { ejsAuthenticate, optionalAuth } = require('./middleware/auth');

// Main page
const Car = require('./models/Vehicles/cars'); // adjust model as needed


// Demo and signup pages
app.get('/demo', (req, res) => {
  res.render('demo');
});
app.get('/signup.html', (req, res) => {
  res.render('signup');
});
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get("/forms/formss", ejsAuthenticate, (req, res) => {
  res.render("forms/formss");
});

app.get("/chat", ejsAuthenticate, (req, res) => {
  res.render("chat");
});

app.get("/activity", ejsAuthenticate, (req, res) => {
  res.render("activity");
});

app.get("/about", (req, res) => {
  res.render("team");
});

app.get("/profile/edit", ejsAuthenticate, (req, res) => {
  res.render("editt");
});

app.get("/wishlist", ejsAuthenticate, (req, res) => {
  res.render("wishlist");
});

app.get("/packages", ejsAuthenticate, async (req, res) => {
  try {
    // Get user's subscription status from User model
    const User = require('./models/User');
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptionStatus = user.getSubscriptionStatus();

    res.render("pacakages", { 
      user: req.user,
      subscriptionStatus: {
        hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
        canListItems: subscriptionStatus.canListMoreItems,
        remainingItems: subscriptionStatus.remainingItems,
        totalItems: subscriptionStatus.totalItems,
        itemsUsed: subscriptionStatus.itemsUsed,
        planId: subscriptionStatus.currentPlan,
        planName: subscriptionStatus.planName,
        extraItemPrice: subscriptionStatus.extraItemPrice
      }
    });
  } catch (error) {
    console.error('Error loading packages page:', error);
    res.render("pacakages", { 
      user: req.user,
      subscriptionStatus: {
        hasActiveSubscription: false,
        canListItems: false,
        remainingItems: 0,
        totalItems: 0,
        itemsUsed: 0
      }
    });
  }
});

// All EJS form routes from original server.js
app.get("/forms/forms/mobiles.html",(req,res)=>{res.render("forms/Mobilees/mobiles")})
app.get("/forms/tablets.html",(req,res)=>{res.render("forms/Mobilees/tablets")})
app.get("/forms/forms/mobile-accessories.html",(req,res)=>{res.render("forms/Mobilees/mobile-accessories")})
app.get("/forms/forms/cars.html",(req,res)=>{res.render("forms/Vehicles/cars")})
app.get("/forms/forms/bikes.html",(req,res)=>{res.render("forms/Vehicles/bikes")})
app.get("/forms/forms/scooters.html",(req,res)=>{res.render("forms/Vehicles/scooters")})
app.get("/forms/forms/bicycles.html",(req,res)=>{res.render("forms/Vehicles/bicycles")})
app.get("/forms/forms/commercial-vehicles.html",(req,res)=>{res.render("forms/Vehicles/commercial-vehicles")})
app.get("/forms/forms/homes.html",(req,res)=>{res.render("forms/Property/homes")})
app.get("/forms/forms/lands.html",(req,res)=>{res.render("forms/Property/lands")})
app.get("/forms/forms/shops.html",(req,res)=>{res.render("forms/Property/shops")})
app.get("/forms/forms/office.html",(req,res)=>{res.render("forms/Property/office")})
app.get("/forms/forms/tv.html",(req,res)=>{res.render("forms/Electronics/tv")})
app.get("/forms/forms/kitchen.html",(req,res)=>{res.render("forms/Electronics/kitchen")})
app.get("/forms/forms/computers.html",(req,res)=>{res.render("forms/Electronics/computers")})
app.get("/forms/forms/cameras.html",(req,res)=>{res.render("forms/Electronics/cameras")})
app.get("/forms/forms/fridge.html",(req,res)=>{res.render("forms/Electronics/fridge")})
app.get("/forms/forms/accessories.html",(req,res)=>{res.render("forms/Electronics/accessories")})
app.get("/forms/forms/games.html",(req,res)=>{res.render("forms/Electronics/games")})
app.get("/forms/forms/washing.html",(req,res)=>{res.render("forms/Electronics/washing")})
app.get("/forms/forms/ac.html",(req,res)=>{res.render("forms/Electronics/ac")})
app.get("/forms/forms/sofa.html",(req,res)=>{res.render("forms/Furniture/sofa")})
app.get("/forms/forms/beds.html",(req,res)=>{res.render("forms/Furniture/beds")})
app.get("/forms/forms/decor.html",(req,res)=>{res.render("forms/Furniture/decor")})
app.get("/forms/forms/kids-furniture.html",(req,res)=>{res.render("forms/Furniture/kids-furniture")})
app.get("/forms/forms/others.html",(req,res)=>{res.render("forms/Furniture/others")})
app.get("/forms/forms/men.html",(req,res)=>{res.render("forms/Fashion/men")})
app.get("/forms/forms/women.html",(req,res)=>{res.render("forms/Fashion/women")})
app.get("/forms/forms/kids.html",(req,res)=>{res.render("forms/Fashion/kids")})
app.get("/forms/forms/aquarium.html",(req,res)=>{res.render("forms/Pets/aquarium")})
app.get("/forms/forms/pet-accessories.html",(req,res)=>{res.render("forms/Pets/pet-accessories")})
app.get("/forms/forms/books-sports.html",(req,res)=>{res.render("forms/Pets/books-sports")})
app.get("/forms/forms/original.html",(req,res)=>{res.render("forms/Spare/original")})
app.get("/forms/forms/aftermarket.html",(req,res)=>{res.render("forms/Spare/aftermarket")})
const reportRouter = require("./routes/report")
app.use("/",reportRouter)

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscription', subscriptionRoutes);
const paymentRoutes = require('./routes/payment');
app.use('/payment', paymentRoutes);
app.use('/api/activity', activityRoutes);

// Wishlist routes
const wishlistRoutes = require('./routes/wishlist');
app.use('/wishlist', wishlistRoutes);

// Item data routes
const itemDataRoutes = require('./routes/item-data');
app.use('/item', itemDataRoutes);

// Original category routers
app.use("/ac", acRouter)
app.use("/camera", cameraRouter)
app.use("/fridge", fridgeRouter)
app.use("/games", gamesRouter)
app.use("/kitchen", kitchenRouter)
app.use("/tv", tvRouter)
app.use("/washing", washingRouter)
app.use("/computers", computersRouter)
app.use("/accessories", accessoriesRouter)
app.use("/men", menRouter)
app.use("/kids", kidsRouter)
app.use("/women", womenRouter)
app.use("/sofa", sofaRouter)
app.use("/beds", bedsRouter)
app.use("/decor", decorRouter)
app.use("/kids-furniture", kidsFurnitureRouter)
app.use("/others", othersRouter)
app.use("/mobiles", mobilesRouter)
app.use("/tablets", tabletsRouter)
app.use("/mobile-accessories", mobileAccessoriesRouter)
app.use("/aquarium", aquariumRouter)
app.use("/pet-accessories", petAccessoriesRouter)
app.use("/books-sports", booksSportsRouter)
app.use("/homes", homesRouter)
app.use("/lands", landsRouter)
app.use("/shops", shopsRouter)
app.use("/office", officeRouter)
app.use("/original", originalRouter)
app.use("/aftermarket", aftermarketRouter)
app.use("/cars", carsRouter)
app.use("/bikes", bikesRouter)
app.use("/scooters", scootersRouter)
app.use("/bicycles", bicyclesRouter)
app.use("/commercial-vehicles", commercialVehiclesRouter)
app.use("/", sellerDashboardRouter)






// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Main route - accessible to all users
app.get('/', optionalAuth, async (req, res) => {
  res.render('auction', { 
    user: req.user || null,
    items: [], // You can add items here if needed
    isAuthenticated: !!req.user 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/`);
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

