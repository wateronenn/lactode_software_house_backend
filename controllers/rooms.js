const Room = require('../models/Room')
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking')


// @desc    view all rooms
// @route   GET api/v1/hotels/:hotelID/rooms
// @access  Public
exports.getManyRooms = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, people } = req.query;

    const filter = { hotelID: req.params.hotelID };
    if (people) filter.people = { $gte: Number(people) };

    const rooms = await Room.find(filter);

    let inDate = null;
    let outDate = null;

    if (checkInDate && checkOutDate) {
      inDate = new Date(checkInDate);
      outDate = new Date(checkOutDate);

      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
        return res.status(400).json({ success: false, msg: 'Invalid date format' });
      }
      if (outDate <= inDate) {
        return res.status(400).json({ success: false, msg: 'checkOutDate must be after checkInDate' });
      }
    }

    // ALWAYS compute availability
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
          available: Math.max(0, room.availableNumber - bookedCount),
        };
      })
    );

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Cannot get rooms: ${err.message}` });
  }
};

// @desc    view single rooms
// @route   GET api/v1/hotels/:hotelID/rooms/:id
// @access  Public
exports.getSingleRoom = async (req, res) => {
    try {
        const {checkInDate , checkOutDate} = req.query
        const room = await Room.findById(req.params.roomID).populate('hotelID', 'name location');

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Make sure the room actually belongs to the hotel in the URL
        if (room.hotelID._id.toString() !== req.params.hotelID) {
            return res.status(400).json({ success: false, message: 'Room does not belong to this hotel' });
        }
    

  
   
        
        return res.status(200).json({ success: true, data: room });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    create room
// @route   POST api/v1/hotels/:hotelID/rooms/:roomId
// @access  admin & hotel
exports.createRoom = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.hotelID);
        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }

        if (req.user.role === 'hotelOwner' && hotel.ownerID.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to create room in this hotel' });
        }

        req.body.hotelID = req.params.hotelID;
        const room = await Room.create(req.body);

        await Hotel.findByIdAndUpdate(req.params.hotelID, {
            $push: { rooms: room._id }
        });

        res.status(201).json({ success: true, data: room });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};


// @desc    update rooms
// @route   PUT api/v1/hotels/:hotelID/rooms/:id
// @access  hotel
exports.updateRoom = async (req, res) => {
    try {
        let room = await Room.findById(req.params.roomID);

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Make sure the room belongs to the hotel in the URL
        if (room.hotelID.toString() !== req.params.hotelID){
            return res.status(400).json({ success: false, message: 'Room does not belong to this hotel' });
        }

        // hotelOwner can only edit rooms under their own hotel
        if (req.user.role === 'hotelOwner') {
            const hotel = await Hotel.findById(room.hotelID);
            if(hotel.ownerID.toString() !== req.user.id.toString()){
                return res.status(403).json({ success: false, message: 'Not authorized to edit this room' });
            }
        }

        // Prevent hotelID from being changed via update
        delete req.body.hotelID;

        room = await Room.findByIdAndUpdate(
            req.params.roomID,
            req.body,
            {
                new: true,
                runValidators: false  // disabled to avoid Mongoose async validator bug on update
            }
        );

        res.status(200).json({ success: true, data: room });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};


// @desc    delete rooms
// @route   DELETE api/v1/hotels/:hotelID/rooms/:roomID
// @access  hotel

exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomID);
        const hotel = await Hotel.findById(req.params.hotelID);

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }

        if (req.user.role === 'hotelOwner') {
            const hotel = await Hotel.findById(room.hotelID);
            if (!hotel || hotel.ownerID.toString() !== req.user.id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete this room' });
            }
        }

        // Find all bookings for this room
        const bookings = await Booking.find({ room: req.params.roomID });

        if (bookings.length > 0) {
            // Find the latest checkout date among all bookings
            const latestCheckout = bookings.reduce((latest, booking) => {
                return booking.checkOutDate > latest ? booking.checkOutDate : latest;
            }, new Date(0));

            const formattedDate = latestCheckout.toISOString().split('T')[0];

            return res.status(400).json({
                success: false,
                message: `Cannot delete room: active bookings exist. You can delete this room after ${formattedDate}.`
            });
        }

        await Hotel.findByIdAndUpdate(room.hotelID, {
            $pull: { rooms: room._id }
        });

        await room.deleteOne();
        res.status(200).json({ success: true, data: {} });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};