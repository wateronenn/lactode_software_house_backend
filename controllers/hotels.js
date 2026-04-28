const Hotel = require('../models/Hotel')
const User = require('../models/User')
const Booking = require('../models/Booking')
const Room = require('../models/Room')

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

    const parsedPeople = Number(people);
    const hasValidPeople = Number.isFinite(parsedPeople) && parsedPeople > 0;

    const hotel = await Hotel.findById(hotelID);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        msg: 'Hotel not found'
      });
    }

    const roomQuery = { hotelID };

    if (hasValidPeople) {
      roomQuery.people = { $gte: parsedPeople };
    }

    const rooms = await Room.find(roomQuery);

    let inDate = null;
    let outDate = null;

    // ✅ validate dates (once)
    if (checkInDate && checkOutDate) {
      inDate = new Date(checkInDate);
      outDate = new Date(checkOutDate);

      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
        return res.status(400).json({
          success: false,
          msg: "Invalid date format"
        });
      }

      if (outDate <= inDate) {
        return res.status(400).json({
          success: false,
          msg: "checkOutDate must be after checkInDate"
        });
      }
    }

    // ✅ ALWAYS compute availability
    const results = await Promise.all(
      rooms.map(async (room) => {
        let bookedCount = 0;

        if (inDate && outDate) {
          bookedCount = await Booking.countDocuments({
            roomID: room._id,
            checkInDate: { $lt: outDate },
            checkOutDate: { $gt: inDate },
          });
        }

        return {
          ...room.toObject(),
          bookedNumber: bookedCount,
          available: Math.max(0, room.availableNumber - bookedCount)
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        ...hotel.toObject(),
        rooms: results
      }
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
        if(req.user.role === 'user'){
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
exports.deleteHotel = async (req, res) => {
    try {
        const { hotelID } = req.params;

        const hotel = await Hotel.findById(hotelID);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                msg: "Hotel not found"
            });
        }

        // ✅ Find latest FUTURE booking only (fast)
        const latestBooking = await Booking.findOne({
            hotelID,
            checkOutDate: { $gt: new Date() }
        }).sort({ checkOutDate: -1 });

        if (latestBooking) {
            const formattedDate = latestBooking.checkOutDate
                .toISOString()
                .split('T')[0];

            return res.status(400).json({
                success: false,
                msg: `Cannot delete hotel: active bookings exist. You can delete after ${formattedDate}.`
            });
        }

        // 🧹 Optional cleanup
        await Room.deleteMany({ hotelID });
        await Booking.deleteMany({ hotelID }); // optional depending on design

        await Hotel.findByIdAndDelete(hotelID);

        res.status(200).json({
            success: true,
            data: {}
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            msg: `Cannot delete hotel: ${err.message}`
        });
    }
};