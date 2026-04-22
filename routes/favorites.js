const express = require('express');
const { compareHotels } = require('../controllers/favorites');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/compare')
    .get(protect, compareHotels);
router.route('/count')
    .get(protect, authorize('hotelOwner'), getFavoriteCount);
module.exports = router;