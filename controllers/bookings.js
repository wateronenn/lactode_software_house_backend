const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room")
const mongoose = require("mongoose");

// ==============================
// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  admin, user, hotelOwner
// ==============================
exports.getManyBookings = async (req, res) => {
  try {
    let query;

    // hotelOwner → bookings in owned hotels
    if (req.user.role === "hotelOwner") {
      const hotels = await Hotel.find({ ownerID: req.user.id });
      const hotelIds = hotels.map(h => h._id);

      query = Booking.find({ hotelID: { $in: hotelIds } })
        .populate("hotelID", "name province tel");
    }

    // user → own bookings
    else if (req.user.role === "user") {
      query = Booking.find({ user: req.user.id })
        .populate("hotelID", "name province tel");
    }

    // admin → all bookings
    else {
      query = Booking.find()
        .populate("hotelID", "name province tel");
    }

    const bookings = await query;

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Cannot get bookings",
    });
  }
};

// ==============================
// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// ==============================
exports.getSingleBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findById(id).populate({
      path: "hotelID",
      select: "name province tel ownerID",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ✅ Authorization
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      booking.hotelID.ownerID?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Cannot get booking",
    });
  }
};

// ==============================
// @desc    Create booking
// @route   POST /api/v1/bookings
// ==============================
exports.addBooking = async (req, res) => {
  try {
    const { hotelID, checkInDate, checkOutDate,roomID } = req.body;

    // ✅ Validate hotelID
    if (!mongoose.Types.ObjectId.isValid(hotelID) || !mongoose.Types.ObjectId.isValid(roomID)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotelID or roomID format",
      });
    } 


    const hotel = await Hotel.findById(hotelID);
    if (!hotel) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotelID",
      });
    }
    const room = await Room.findById(roomID);
    if (!room) {
      return res.status(400).json({
        success: false,
        message: "Invalid roomID",
      });
    }

      const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);

    const bookedCount = await Booking.countDocuments({
      roomID: roomID,
      checkInDate: { $lt: outDate },
      checkOutDate: { $gt: inDate }
    });

    if (bookedCount >= room.amount) {
      return res.status(400).json({
        success: false,
        message: "Room fully booked"
      });
    }

    // assign user
    if (req.user.role !== "admin") {
      req.body.user = req.user.id;
    }

    // validate dates
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide checkInDate and checkOutDate",
      });
    }

  

    if (isNaN(inDate) || isNaN(outDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (outDate <= inDate) {
      return res.status(400).json({
        success: false,
        message: "checkOutDate must be after checkInDate",
      });
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const days = (outDate - inDate) / MS_PER_DAY;

    if (req.user.role !== "admin" && days > 3) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot exceed 3 days",
      });
    }

    const booking = await Booking.create(req.body);
    await booking.populate('user');
    res.status(201).json({
      success: true,
      data: booking,
      user: booking.user
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Cannot create booking",
    });
  }
};

// ==============================
// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// ==============================
exports.updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id).populate("hotelID");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ✅ Authorization
    const isBookingOwner = booking.user.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    const isHotelOwner = booking.hotelID.ownerID?.toString() === req.user.id;
    if (!isBookingOwner && !isAdmin && !isHotelOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // allow only date updates
    const allowed = ["checkInDate", "checkOutDate"];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (allowed.includes(key)) {
        updateData[key] = req.body[key];
      }
      else{
        return res.status(400).json({
          success: false,
          message: "Cannot update data exclude date",
      });
      }
    });

    const checkIn = updateData.checkInDate
      ? new Date(updateData.checkInDate)
      : booking.checkInDate;

    const checkOut = updateData.checkOutDate
      ? new Date(updateData.checkOutDate)
      : booking.checkOutDate;

    if (isNaN(checkIn) || isNaN(checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: "checkOutDate must be after checkInDate",
      });
    }
    const days = (checkOut - checkIn) / (1000 * 60 * 60 * 24);

    if (req.user.role !== "admin" && days > 3) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot exceed 3 days",
      });
    }

    booking = await Booking.findById(req.params.id)
    booking.checkInDate = checkIn;
    booking.checkOutDate = checkOut;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Cannot update booking",
    });
  }
};

// ==============================
// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// ==============================
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;



    const booking = await Booking.findById(id).populate("hotelID");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ✅ Authorization
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      booking.hotelID.ownerID?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Cannot delete booking",
    });
  }
};