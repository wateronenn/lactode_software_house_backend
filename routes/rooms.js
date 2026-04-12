const express = require('express');
const { getSingleRoom, updateRoom } = require('../controllers/rooms');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/:id')
    .get(getSingleRoom)                                          
    .put(protect, authorize('admin', 'hotelOwner'), updateRoom) 

module.exports = router;