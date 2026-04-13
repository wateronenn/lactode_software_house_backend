const Room = require('../models/Room')
const Hotel = require('../models/Hotel');


// @desc    view all rooms
// @route   GET api/v1/hotels/:id/rooms
// @access  Public

// @desc    view single rooms
// @route   GET api/v1/hotels/:id/rooms/:id
// @access  Public
exports.getSingleRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('hotelID', 'name location');

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Make sure the room actually belongs to the hotel in the URL
        if (room.hotelID._id.toString() !== req.params.hotelID) {
            return res.status(400).json({ success: false, message: 'Room does not belong to this hotel' });
        }

        res.status(200).json({ success: true, data: room });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    create room
// @route   POST api/v1/hotels/:id/rooms
// @access  hotel
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
// @route   PUT api/v1/hotels/:id/rooms/:id
// @access  hotel
exports.updateRoom = async (req, res) => {
    try {
        let room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Make sure the room belongs to the hotel in the URL
        if (room.hotelID.toString() !== req.params.hotelID) {
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
            req.params.id,
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
// @route   DELETE api/v1/hotels/:id/rooms/:id
// @access  hotel

exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (req.user.role === 'hotelOwner') {
            const hotel = await Hotel.findById(room.hotelID);
            if (!hotel || hotel.ownerID.toString() !== req.user.id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete this room' });
            }
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
