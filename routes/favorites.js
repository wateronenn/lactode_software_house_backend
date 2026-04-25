const express = require('express');
const { addFavorite, removeFavorite, removeAllFavorites, getFavorites, compareHotels } = require('../controllers/favorites');
const router = express.Router();
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Favorite:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: string
 *         province:
 *           type: string
 *         district:
 *           type: string
 *         region:
 *           type: string
 *         postalcode:
 *           type: string
 *         tel:
 *           type: string
 *         email:
 *           type: string
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *             enum: [wifi, parking, pool, gym, restaurant, bar, spa, laundry, room_service, air_conditioning, heating, concierge, conference_room, elevator, garden, library, safe, tv, minibar, kitchen]
 *         status:
 *           type: string
 *           enum: [available, occupied, maintenance, reserved]
 *         favoriteBy:
 *           type: integer
 *           minimum: 0
 *         bookedTimes:
 *           type: integer
 *           minimum: 0
 *         pictures:
 *           type: array
 *           items:
 *             type: string
 *         rooms:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CompareRoom:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         roomType:
 *           type: string
 *           enum: [single, double, twin, suite, deluxe, family, studio]
 *         bedType:
 *           type: string
 *           enum: [single, double, queen, king, twin]
 *         bed:
 *           type: integer
 *         price:
 *           type: number
 *         description:
 *           type: string
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *         availableNumber:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [available, occupied, maintenance, reserved]
 *         people:
 *           type: integer
 *
 *     CompareHotelResult:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         location:
 *           type: string
 *         province:
 *           type: string
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *         favoriteBy:
 *           type: integer
 *         avgPrice:
 *           type: number
 *           nullable: true
 *           description: Average price of filtered rooms (null if no rooms match)
 *         rooms:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CompareRoom'
 *         bestFor:
 *           type: string
 *           description: AI-generated best fit description (max 10 words)
 *         summary:
 *           type: string
 *           description: AI-generated summary comparing location and facilities (max 30 words)
 */

/**
 * @swagger
 * /api/v1/favorites:
 *   get:
 *     summary: Get all favorite hotels of the logged-in user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Favorite'
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Remove all favorite hotels of the logged-in user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All favorites removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All favorites removed
 *       400:
 *         description: No favorites to remove
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: No favorites to remove
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/favorites/compare:
 *   get:
 *     summary: Compare two hotels side by side with their rooms and AI summary
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotel1
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectID of the first hotel
 *       - in: query
 *         name: hotel2
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectID of the second hotel
 *       - in: query
 *         name: province
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter - both hotels must match this province
 *       - in: query
 *         name: people
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filter - only include rooms that accommodate this many people or more
 *     responses:
 *       200:
 *         description: Comparison result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hotel1:
 *                       $ref: '#/components/schemas/CompareHotelResult'
 *                     hotel2:
 *                       $ref: '#/components/schemas/CompareHotelResult'
 *       400:
 *         description: Missing params / invalid ID format / same hotel / province mismatch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: Please provide hotel1 and hotel2
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       404:
 *         description: One or both hotels not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/favorites/{hotelID}:
 *   post:
 *     summary: Add a hotel to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectID of the hotel to add
 *     responses:
 *       201:
 *         description: Hotel added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Added to favorites
 *                 count:
 *                   type: integer
 *                   description: Total number of favorites after adding
 *                   example: 3
 *                 data:
 *                   type: array
 *                   description: Updated list of favorite hotel IDs
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid hotel ID or hotel already in favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Hotel already in favorites
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Remove a hotel from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectID of the hotel to remove
 *     responses:
 *       200:
 *         description: Hotel removed from favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Removed from favorites
 *       400:
 *         description: Invalid hotel ID or hotel not in favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Hotel not in favorites
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Internal server error
 */

router.route('/compare')
    .get(protect, compareHotels);

router.route('/')
    .get(protect, getFavorites)
    .delete(protect, removeAllFavorites);

router.route('/:hotelID')
    .post(protect, addFavorite)
    .delete(protect, removeFavorite);

module.exports = router;