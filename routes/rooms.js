const express = require('express');
const { getManyRooms,getSingleRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/rooms');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getManyRooms)
    .post(protect, authorize('hotelOwner'), createRoom)

router.route('/:roomID')
    .get(getSingleRoom)                                          
    .put(protect, authorize('hotelOwner'), updateRoom)
    .delete(protect, authorize('hotelOwner'), deleteRoom)

module.exports = router;