const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const mongoose = require('mongoose');

// @desc    Compare two hotels side by side with their rooms
// @route   GET /api/v1/favorites/compare
// @access  Private
exports.compareHotels = async (req, res) => {
    try {
        const { hotel1, hotel2 } = req.query;

        // Validate both params exist
        if (!hotel1 || !hotel2) {
            return res.status(400).json({
                success: false,
                msg: 'Please provide both hotel1 and hotel2 query parameters'
            });
        }

        // Validate both are valid MongoDB ObjectIDs
        if (!mongoose.Types.ObjectId.isValid(hotel1) || !mongoose.Types.ObjectId.isValid(hotel2)) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid hotel ID format'
            });
        }

        // Prevent comparing a hotel with itself
        if (hotel1 === hotel2) {
            return res.status(400).json({
                success: false,
                msg: 'Cannot compare a hotel with itself'
            });
        }

        // Fetch both hotels concurrently
        const [hotelOne, hotelTwo] = await Promise.all([
            Hotel.findById(hotel1),
            Hotel.findById(hotel2)
        ]);

        if (!hotelOne) {
            return res.status(404).json({
                success: false,
                msg: `Hotel not found: ${hotel1}`
            });
        }

        if (!hotelTwo) {
            return res.status(404).json({
                success: false,
                msg: `Hotel not found: ${hotel2}`
            });
        }

        // Fetch rooms for both hotels concurrently, sorted by price ascending
        const [roomsOne, roomsTwo] = await Promise.all([
            Room.find({ hotelID: hotel1 }).sort({ price: 1 }),
            Room.find({ hotelID: hotel2 }).sort({ price: 1 })
        ]);

        res.status(200).json({
            success: true,
            data: {
                hotel1: {
                    ...hotelOne.toObject(),
                    rooms: roomsOne
                },
                hotel2: {
                    ...hotelTwo.toObject(),
                    rooms: roomsTwo
                }
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            msg: err.message
        });
    }
};