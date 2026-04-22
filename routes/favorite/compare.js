const express = require('express');
const { compareHotels } = require('../controllers/favorite/compare');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/compare')
    .get(protect , compareHotels);

module.exports = router;