const express = require("express");
require("dotenv").config({ path: "./config/config.env" });
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
connectDB();
// Route files
const auth = require("./routes/auth");
const hotels = require("./routes/hotels");
const bookings = require("./routes/bookings");
const rooms = require("./routes/rooms");
const favorites = require("./routes/favorites");

const app = express();

// Body parser
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(xss()); //cant use xss because it will cause problem with query string in GET /api/v1/hotels

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
});

// Apply middleware
if (process.env.NODE_ENV !== 'test') {
  app.use("/api", apiLimiter);
  app.use("/api/v1/auth", authLimiter);
}

// Routes
app.use("/api/v1/hotels", hotels);
app.use("/api/v1/auth", auth);
app.use("/api/v1/hotels/:hotelID/rooms", rooms);
app.use("/api/v1/bookings", bookings);
app.use("/api/v1/favorites", favorites);

// Query parser
app.set("query parser", "extended");

module.exports = app;