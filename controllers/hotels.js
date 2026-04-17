const Hotel = require('../models/Hotel')

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
exports.getSingleHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.hotelID)

        if (!hotel) {
            return res.status(404).json({
                success: false,
                msg: 'Hotel not found'
            })
        }

        res.status(200).json({
            success: true,
            data: hotel
        })
    } catch (err) {
        // Handle invalid MongoDB ObjectId format
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                msg: `Invalid hotel ID format: ${req.params.hotelID}`
            })
        }

        res.status(500).json({
            success: false,
            msg: err.message
        })
    }
}
// @desc    create hotel
// @route   POST api/v1/hotels
// @access  admin
exports.createHotel = async (req,res,next) => {
    if(req.user.role !== 'admin'){
        res.status(403).json({
            success:false,
            msg:"Not authorized to access this path"
        })
    }
    try{
        const hotel = await Hotel.create(req.body)

        res.status(201).json({
            success:true,
            data:hotel
        });
    }catch (err){
        res.status(400).json({
            success:false,
            msg:`Cannot create hotel : ${err.message}`
        })
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
exports.deleteHotel = async(req,res,next) => {
    if(req.user.role !== 'admin'){
        res.status(403).json({
            success:false,
            msg:"Not authorized to access this path"
        })
    }
    try{
        const hotel = await Hotel.findByIdAndDelete(req.params.hotelID);

        if(!hotel){
            return res.status(400).json({success:false});
        }
        res.status(200).json({success:true,data:{}});
    }catch (err){
        res.status(400).json({
            success:false,
            msg:`Cannot delete hotel : ${err.message}`
        })
    }
}