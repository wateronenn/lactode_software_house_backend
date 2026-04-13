const express = require('express');
const {getManyHotels,getSingleHotel,createHotel,updateHotel,deleteHotel} = require('../controllers/hotels');
const router = express.Router();
const {protect,authorize} = require('../middleware/auth');
const roomRouter = require('./rooms')

router.use('/:hotelID/rooms',roomRouter) // override path for room under the management of hotel
router.route('/')
    .get(getManyHotels)
    .post(protect,authorize('admin'),createHotel)
router.route('/:id')
    .get(getSingleHotel)
    .put(protect,authorize('admin','hotelOwner'),updateHotel)
    .delete(protect,authorize('admin'),deleteHotel)

module.exports = router;
