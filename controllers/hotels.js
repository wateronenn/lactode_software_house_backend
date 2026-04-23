const Hotel = require('../models/Hotel')
const User = require('../models/User')
const Booking = require('../models/Booking')

// @desc    view all hotels
// @route   GET /api/v1/hotels
// @access  Public
exports.getManyHotels = async (req, res, next) => {
    try {
        const queryObj = { ...req.query }

        // Remove special fields before filtering
        const removeFields = ['select', 'sort', 'page', 'limit']
        removeFields.forEach(param => delete queryObj[param])

        // Convert operators e.g. gt -> $gt
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)

        // Build query
        let query = Hotel.find(JSON.parse(queryStr))

        // Handle SELECT (field projection)
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ')
            query = query.select(fields)
        }

        // Handle SORT
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ')
            query = query.sort(sortBy)
        } else {
            query = query.sort('-createdAt') // default: newest first
        }

        // Execute query
        const hotels = await query

        res.status(200).json({
            success: true,
            count: hotels.length,
            data: hotels
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            msg: err.message
        })
    }
}


// @desc    view single hotel
// @route   GET /api/v1/hotels/:hotelID
// @access  Public
exports.getSingleHotel = async (req, res) => {
  try {
    const { hotelID } = req.params;
    const { checkInDate, checkOutDate, people } = req.query;

    const hotel = await Hotel.findById(hotelID);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        msg: 'Hotel not found'
      });
    }

 
  

    return res.status(200).json({
      success: true,
      data: hotel
    });

  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        msg: "Invalid hotel ID format"
      });
    }

    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};
// @desc    create hotel
// @route   POST api/v1/hotels
// @access  admin
exports.createHotel = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    const { ownerEmail } = req.body;


    if (!ownerEmail) {
      return res.status(400).json({
        success: false,
        message: "ownerEmail is required"
      });
    }


    const user = await User.findOne({ email: ownerEmail });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    
    if (user.role !== "hotelOwner") {
      return res.status(400).json({
        success: false,
        message: "User is not a hotel owner"
      });
    }


    const hotel = await Hotel.create({
      ...req.body,
      ownerID: user._id
    });

    res.status(201).json({
      success: true,
      data: hotel
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Cannot create hotel"
    });
  }
};


// @desc    update hotel
// @route   PUT api/v1/hotels/:hotelID
// @access  admin , hotel owner


exports.updateHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.hotelID);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                msg: "Hotel not found"
            });
        }

        // 🔥 check permission
        if (
            req.user.role !== 'admin' &&
            (req.user.role === 'hotelOwner' && hotel.ownerID.toString() !== req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                msg: "Not authorized to access this path"
            });
        }

        const updatedHotel = await Hotel.findByIdAndUpdate(
            req.params.hotelID,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: updatedHotel
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            msg: `Cannot update hotel : ${err}`
        });
    }
};




// @desc    delete hotel
// @route   DELETE api/v1/hotels/:hotelID
// @access  admin
exports.deleteHotel = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            msg: "Not authorized to access this path"
        });
    }

    try {
        const hotel = await Hotel.findById(req.params.hotelID);

        if (!hotel) {
            return res.status(404).json({ success: false, msg: "Hotel not found" });
        }

        // Find all bookings for this hotel
        const bookings = await Booking.find({ hotel: req.params.hotelID });

        if (bookings & bookings.length > 0) {
            // Find the latest checkout date among all bookings
            const latestCheckout = bookings.reduce((latest, booking) => {
                return booking.checkOutDate > latest ? booking.checkOutDate : latest;
            }, new Date(0));

            const formattedDate = latestCheckout.toISOString().split('T')[0];

            return res.status(400).json({
                success: false,
                msg: `Cannot delete hotel: active bookings exist. You can delete this hotel after ${formattedDate}.`
            });
        }

        await Hotel.findByIdAndDelete(req.params.hotelID);

        res.status(200).json({ success: true, data: {} });

    } catch (err) {
        res.status(500).json({
            success: false,
            msg: `Cannot delete hotel: ${err.message}`
        });
    }
};