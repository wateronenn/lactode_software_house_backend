const express = require("express");

const { getManyBookings, getSingleBooking, addBooking, updateBooking, deleteBooking } = require("../controllers/bookings");

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

router.route("/")
    .get(protect, getManyBookings)
    .post(protect, authorize('admin','hotelOwner','user'),addBooking);

router.route('/:id')
    .get(protect,getSingleBooking)
    .put(protect, authorize('admin','hotelOwner','user'),updateBooking)
    .delete(protect, authorize('admin','hotelOwner','user'),deleteBooking);

module.exports = router;