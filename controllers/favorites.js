const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const mongoose = require('mongoose')
const {generateAIReview} = require('./aiService')

const formatFacilities = (facilities) => {
    if (!facilities || facilities.length === 0) return "No facilities listed";
    return facilities.join(", ");
};

const buildPrompt = (hotel, avgPrice) => {
    const facilitiesText = formatFacilities(hotel.facilities);

    return `
    You are an API. Return ONLY valid JSON. No explanation.
    Hotel:
    Name: ${hotel.name}
    Location: ${hotel.location}
    Facilities: ${facilitiesText}
    Description: ${hotel.description}
    Starting price: ${avgPrice}

    Tasks:
    1. Who is this hotel best for (MAX 10 words)
    2. Short summary including location and facilities (MAX 30 words)

    Rules:
    - MUST consider facilities in reasoning
    - Do NOT exceed word limits
    - No extra text

    Return EXACTLY:
    {
    "bestFor": "...",
    "summary": "..."
    }
    `;
};


// @desc    Add favorite hotel
// @route   POST /api/v1/favorites/:hotelID
// @access  Private (user)
exports.addFavorite = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.hotelID)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid hotel ID' 
            });
        }

        const hotel = await Hotel.findById(req.params.hotelID);
        if (!hotel) {
            return res.status(404).json({ 
                success: false, 
                message: 'Hotel not found' 
            });
        }

        const user = await User.findById(req.user.id);
        if (user.favoriteHotels.includes(req.params.hotelID)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Hotel already in favorites' 
            });
        }

        await User.findByIdAndUpdate(req.user.id, {
            $push: { favoriteHotels: req.params.hotelID }
        });
        await Hotel.findByIdAndUpdate(req.params.hotelID, {
            $inc: { favoriteBy: 1 }
        });

        const updatedUser = await User.findById(req.user.id);

        res.status(201).json({ 
        success: true, 
        message: 'Added to favorites',
        count: updatedUser.favoriteHotels.length,
        data: updatedUser.favoriteHotels
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// @desc    Remove favorite hotel
// @route   DELETE /api/v1/favorites/:hotelID
// @access  Private (user)
exports.removeFavorite = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.hotelID)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid hotel ID' 
            });
        }

        const hotel = await Hotel.findById(req.params.hotelID);
        if (!hotel) {
            return res.status(404).json({ 
                success: false, 
                message: 'Hotel not found' 
            });
        }

        const user = await User.findById(req.user.id);
        if (!user.favoriteHotels.includes(req.params.hotelID)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Hotel not in favorites' 
            });
        }

        await User.findByIdAndUpdate(req.user.id, {
            $pull: { favoriteHotels: req.params.hotelID }
        });
        await Hotel.findByIdAndUpdate(req.params.hotelID, {
            $inc: { favoriteBy: -1 }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Removed from favorites' 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// @desc    Clear all favorite hotels
// @route   DELETE /api/v1/favorites
// @access  Private (user)
exports.removeAllFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.favoriteHotels.length === 0) {
            return res.status(400).json({ success: false, message: 'No favorites to remove' });
        }

        await Hotel.updateMany(
            { _id: { $in: user.favoriteHotels } },
            { $inc: { favoriteBy: -1 } }
        );

        await User.findByIdAndUpdate(req.user.id, {
            $set: { favoriteHotels: [] }
        });

        res.status(200).json({ 
            success: true, 
            message: 'All favorites removed' 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// @desc    Get favorite hotels of current user
// @route   GET /api/v1/favorites
// @access  Private (user)
exports.getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favoriteHotels');
        res.status(200).json({
            success: true,
            count: user.favoriteHotels.length,
            data: user.favoriteHotels
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message
        });
    }
};



// @desc    Compare two hotels side by side with their rooms
// @route   GET /api/v1/favorites/compare
// @access  Private
exports.compareHotels = async (req, res) => {
    try {
        const { hotel1, hotel2, province, people } = req.query;

        // ✅ Validate IDs
        if (!hotel1 || !hotel2) {
            return res.status(400).json({
                success: false,
                msg: 'Please provide hotel1 and hotel2'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(hotel1) || !mongoose.Types.ObjectId.isValid(hotel2)) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid hotel ID format'
            });
        }

        if (hotel1 === hotel2) {
            return res.status(400).json({
                success: false,
                msg: 'Cannot compare the same hotel'
            });
        }

        // ✅ Fetch hotels
        const [h1, h2] = await Promise.all([
            Hotel.findById(hotel1),
            Hotel.findById(hotel2)
        ]);

        if (!h1 || !h2) {
            return res.status(404).json({
                success: false,
                msg: 'One or both hotels not found'
            });
        }

        // ✅ Filter by province (if provided)
        if (province) {
            if (h1.location !== province || h2.location !== province) {
                return res.status(400).json({
                    success: false,
                    msg: 'Hotels do not match selected province'
                });
            }
        }

        // ✅ Fetch rooms with capacity filter
        const capacityFilter = people ? { capacity: { $gte: Number(people) } } : {};

        const [rooms1, rooms2] = await Promise.all([
            Room.find({ hotelID: hotel1, ...capacityFilter }),
            Room.find({ hotelID: hotel2, ...capacityFilter })
        ]);

        // ✅ Calculate average price
        const calcAvg = (rooms) => {
            if (!rooms.length) return null;
            const total = rooms.reduce((sum, r) => sum + r.price, 0);
            return Math.round(total / rooms.length);
        };

        const avg1 = calcAvg(rooms1);
        const avg2 = calcAvg(rooms2);

        // 🧠 Build prompts
        const prompt1 = buildPrompt(h1, avg1);
        const prompt2 = buildPrompt(h2, avg2);

    const ai1 = await generateAIReview(prompt1);
    const ai2 = await generateAIReview(prompt2);
        // ✅ Response
        res.status(200).json({
            success: true,
            data: {
                hotel1: {
                    ...h1.toObject(),
                    avgPrice: avg1,
                    rooms: rooms1,
                    bestFor: ai1?.bestFor || "Unknown",
                    summary : ai1?.summary || "No summary"
                },
                hotel2: {
                    ...h2.toObject(),
                    avgPrice: avg2,
                    bestFor: ai2?.bestFor || "Unknown",
                    summary : ai2?.summary || "No summary"
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

module.exports.generateAIReview = generateAIReview;