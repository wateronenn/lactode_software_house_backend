const express = require('express');
const { getSingleRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/rooms');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/')
    .post(protect, authorize('hotelOwner'), createRoom)

router.route('/:id')
    .get(getSingleRoom)                                          
    .put(protect, authorize('hotelOwner'), updateRoom)
    .delete(protect, authorize('hotelOwner'), deleteRoom)

module.exports = router;