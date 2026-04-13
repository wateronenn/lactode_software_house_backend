const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimit = require("express-rate-limit");

// Route files
const auth = require("./routes/auth");
const hotels = require("./routes/hotels");
// const bookings = require("./routes/bookings");
const rooms = require("./routes/rooms");

const app = express();

// Body parser
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(xss());

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
});

// Apply middleware
app.use("/api", apiLimiter);
app.use("/api/v1/auth", authLimiter);

// Routes
app.use("/api/v1/hotels", hotels);
app.use("/api/v1/auth", auth);
app.use("/api/v1/hotels/:hotelId/rooms", rooms);
// app.use("/api/v1/bookings", bookings);

// Query parser
app.set("query parser", "extended");

module.exports = app;