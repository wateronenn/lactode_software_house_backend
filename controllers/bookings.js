const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");


// @desc    view all bookings
// @route   GET api/v1/booking
// @access  admin , user , hotel
exports.getManyBookings = async (req, res, next) => {
  let query;
    if(req.user.role === "hotelOwner"){
        const hotels = await Hotel.find({ owner: req.user.id });
        const hotelIds = hotels.map(h => h._id);

        query = Booking.find({ hotelID: { $in: hotelIds } })
            .populate('hotelID', 'name province tel');
        }
    else if (req.user.role === "user"){
        query = Booking.find({ user: req.user.id }).populate({
            path:'hotelID',
            select:'name province tel'
        });
    }
    //admin route : get all bookings
     else {
    if(req.params.hotelId){
        console.log(req.params.hotelID);
        query=Booking.find({hotel:req.params.hotelID});
    }else{
        query = Booking.find().populate({
        path:'hotelID',
        select:'name province tel'
    });
    }
    
  }
  try {
    const booking = await query;

    res.status(200).json({
      success: true,
      count: booking.length,
      data: booking,
    });
  } catch (err) {
    console.log(err.stack);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Booking" });
  }
};


// @desc    view single bookings
// @route   GET api/v1/bookings/:id
// @access  admin, user,hotel
exports.getSingleBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'hotelID',
      select: 'name province tel owner'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      booking.hotelID.ownerID?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this booking"
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Booking"
    });
  }
};


// @desc    create booking
// @route   POST api/v1/bookings
// @access  user
exports.addBooking = async (req, res, next) => {
  try {
    req.body.hotel = req.params.hotelId;

    const hotel = await Hotel.findById(req.params.hotelID);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `No hotel with the id of ${req.params.hotelID}`,
      });
    }

    if (req.user.role !== "admin") {
    req.body.user = req.user.id;
  }

    const { checkInDate, checkOutDate } = req.body;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide checkInDate and checkOutDate",
      });
    }

    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);

    const checkIn = new Date(inDate.getFullYear(), inDate.getMonth(), inDate.getDate());
    const checkOut = new Date(outDate.getFullYear(), outDate.getMonth(), outDate.getDate());

    // validate date
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

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const days = (checkOut - checkIn) / MS_PER_DAY;

    // max 3 days
    if (req.user.role !== "admin" && days > 3) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot exceed 3 days",
      });
    }

    const booking = await Booking.create(req.body);

    return res.status(201).json({
      success: true,
      data: booking,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Cannot create booking",
    });
  }
};

// @desc    update bookings
// @route   PUT api/v1/bookings/:id
// @access  admin, user,hotel
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id).populate('hotelID');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    // ✅ Authorization
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      booking.hotelID.ownerID?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this booking`
      });
    }

    const allowedFields = ['checkInDate', 'checkOutDate'];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const checkIn = updateData.checkInDate
      ? new Date(updateData.checkInDate)
      : booking.checkInDate;

    const checkOut = updateData.checkOutDate
      ? new Date(updateData.checkOutDate)
      : booking.checkOutDate;

    const inDate = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const outDate = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());

    if (isNaN(inDate) || isNaN(outDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    if (outDate <= inDate) {
      return res.status(400).json({
        success: false,
        message: "checkOutDate must be after checkInDate"
      });
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const days = (outDate - inDate) / MS_PER_DAY;

    if (req.user.role !== "admin" && days > 3) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot exceed 3 days"
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot update Booking"
    });
  }
};
// @desc    delete bookings
// @route   DELETE api/v1/bookings/:id
// @access  admin, user,hotel
exports.deleteBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id).populate('hotelID');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      booking.hotelID.ownerID?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this booking`
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot delete Booking"
    });
  }
};