const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');


// @desc    view all rooms
// @route   GET api/v1/hotels/:hotelID/rooms
// @access  Public
exports.getManyRooms = async (req, res) => {
    try {
        const { checkInDate, checkOutDate, people } = req.query;

        const filter = { hotelID: req.params.hotelID };

        // ✅ FIX: use capacity instead of people
        if (people) filter.capacity = { $gte: Number(people) };

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
        res.status(500).json({
            success: false,
            msg: `Cannot get rooms: ${err.message}`
        });
    }
};



// @desc    view single room
// @route   GET api/v1/hotels/:hotelID/rooms/:roomID
// @access  Public
exports.getSingleRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomID)
            .populate('hotelID', 'name location');

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // ✅ FIX: safe check
        if (!room.hotelID || room.hotelID._id.toString() !== req.params.hotelID) {
            return res.status(400).json({
                success: false,
                message: 'Room does not belong to this hotel'
            });
        }

        res.status(200).json({ success: true, data: room });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};



// @desc    create room
// @route   POST api/v1/hotels/:hotelID/rooms
// @access  admin & hotelOwner
exports.createRoom = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.hotelID);

        if (!hotel) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }

        if (req.user.role === 'hotelOwner' &&
            hotel.ownerID.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create room in this hotel'
            });
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
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({ success: false, message: err.message });
    }
};



// @desc    update room
// @route   PUT api/v1/hotels/:hotelID/rooms/:roomID
// @access  hotelOwner
exports.updateRoom = async (req, res) => {
    try {
        let room = await Room.findById(req.params.roomID);

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // ✅ FIX: ensure relation
        if (room.hotelID.toString() !== req.params.hotelID) {
            return res.status(400).json({
                success: false,
                message: 'Room does not belong to this hotel'
            });
        }

        // ✅ owner check
        if (req.user.role === 'hotelOwner') {
            const ownerHotel = await Hotel.findById(room.hotelID);

            if (!ownerHotel ||
                ownerHotel.ownerID.toString() !== req.user.id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to edit this room'
                });
            }
        }

        // prevent changing hotelID
        delete req.body.hotelID;

        room = await Room.findByIdAndUpdate(
            req.params.roomID,
            req.body,
            {
                new: true,
                runValidators: false
            }
        );

        res.status(200).json({ success: true, data: room });

    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({ success: false, message: err.message });
    }
};



// @desc    delete room
// @route   DELETE api/v1/hotels/:hotelID/rooms/:roomID
// @access  hotelOwner
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

        // ✅ FIX: ensure relation
        if (room.hotelID.toString() !== req.params.hotelID) {
            return res.status(400).json({
                success: false,
                message: 'Room does not belong to this hotel'
            });
        }

        // ✅ owner check
        if (req.user.role === 'hotelOwner') {
            const ownerHotel = await Hotel.findById(room.hotelID);

            if (!ownerHotel ||
                ownerHotel.ownerID.toString() !== req.user.id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this room'
                });
            }
        }

        // ✅ FIX: consistent field name + only future bookings
        const bookings = await Booking.find({
            roomID: req.params.roomID,
            checkOutDate: { $gt: new Date() }
        });

        if (bookings.length > 0) {
            const latestCheckout = bookings.reduce((latest, booking) => {
                return booking.checkOutDate > latest ? booking.checkOutDate : latest;
            }, new Date(0));

            const formattedDate = latestCheckout.toISOString().split('T')[0];

            return res.status(400).json({
                success: false,
                message: `Cannot delete room: active bookings exist. You can delete after ${formattedDate}`
            });
        }

        // remove from hotel
        await Hotel.findByIdAndUpdate(room.hotelID, {
            $pull: { rooms: room._id }
        });

        await room.deleteOne();

        res.status(200).json({ success: true, data: {} });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};