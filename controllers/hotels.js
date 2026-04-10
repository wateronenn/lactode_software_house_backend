const Hotel = require('../models/Hotel')


// @desc    view all hotel
// @route   GET api/v1/hotels
// @access  Public
exports.getManyHotels = async(req,res,next) => {

}



// @desc    view single user
// @route   GET /api/v1/hotels/:id
// @access  Public
exports.getSingleHotel = async(req,res,next) => {

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
            msg:`Cannot create hotel : {$err}`
        })
    }
};


// @desc    update hotel
// @route   PUT api/v1/hotels/:id
// @access  admin , hotel owner


exports.updateHotel = async(req,res,next) => {
    if(req.user.role !== 'admin' && req.user.role !== 'hotel'){
        res.status(403).json({
            success:false,
            msg:"Not authorized to access this path"
        })
    }
    if(req.user.role === 'hotel' && req.user.id !== req.params.ownerID){
        res.status(403).json({
            success:false,
            msg:"Not authorized to access this path"
        })
    }
    try{
        const hotel = await Hotel.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true 
        });

        if(!hotel){
            return res.status(400).json({success:false});
        }
        res.status(200).json({success:true,data:hotel});
    }catch (err){
        res.status(400).json({
            success:false,
            msg:`Cannot update hotel : {$err}`
        })
    }
}




// @desc    delete hotel
// @route   DELETE api/v1/hotels/:id
// @access  admin
exports.deleteHotel = async(req,res,next) => {

}


