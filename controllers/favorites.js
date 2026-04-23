const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

// @desc    Add favorite hotel
// @route   PUT /api/v1/favorites/:hotelID
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

        res.status(200).json({ 
            success: true, 
            message: 'Added to favorites' 
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

