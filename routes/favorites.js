const express = require('express');
const { addFavorite, removeFavorite, removeAllFavorites, getFavorites } = require('../controllers/favorites');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/compare')
    .get(protect , compareHotels);

router.route('/')
    .get(protect, getFavorites)
    .delete(protect, removeFavorites);

router.route('/:hotelID')
    .post(protect, addFavorite)
    .delete(protect, removeFavorite);

module.exports = router;