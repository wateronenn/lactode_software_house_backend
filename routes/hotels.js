const express = require('express');
const {getManyHotels,getSingleHotel,createHotel,updateHotel,deleteHotel} = require('../controllers/hotels');
const router = express.Router();
const {protect,authorize} = require('../middleware/auth');
const roomRouter = require('./rooms')

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotel:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - ownerID
 *         - tel
 *         - email
 *         - district
 *         - province
 *         - postalcode
 *         - region
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 2000
 *           default: ''
 *         location:
 *           type: string
 *         ownerID:
 *           type: string
 *           description: User ID (ref User, role must be hotelOwner)
 *         tel:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         district:
 *           type: string
 *         province:
 *           type: string
 *         postalcode:
 *           type: string
 *         region:
 *           type: string
 *         pictures:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 20
 *           default: []
 *         rooms:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of Room IDs (ref Room)
 *           default: []
 *         roomTypes:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 10
 *           default: []
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *             enum: [wifi, parking, pool, gym, restaurant, bar, spa, laundry, room_service, air_conditioning, heating, concierge, conference_room, elevator, garden, library, safe, tv, minibar, kitchen]
 *           default: []
 *         status:
 *           type: string
 *           enum: [available, occupied, maintenance, reserved]
 *           default: available
 *         favoriteBy:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         bookedTimes:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/hotels:
 *   get:
 *     summary: Get all hotels
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: Fields to select (comma-separated)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by field (comma-separated)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       201:
 *         description: Hotel created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelID}:
 *   get:
 *     summary: Get single hotel with rooms and availability
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectID of the hotel
 *       - in: query
 *         name: checkInDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-06-01"
 *         description: Check-in date to calculate room availability
 *       - in: query
 *         name: checkOutDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-06-05"
 *         description: Check-out date to calculate room availability (must be after checkInDate)
 *       - in: query
 *         name: people
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         description: Minimum room capacity required (defaults to 1 if not provided)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     location:
 *                       type: string
 *                     province:
 *                       type: string
 *                     district:
 *                       type: string
 *                     region:
 *                       type: string
 *                     postalcode:
 *                       type: string
 *                     tel:
 *                       type: string
 *                     email:
 *                       type: string
 *                     facilities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
 *                       enum: [available, occupied, maintenance, reserved]
 *                     favoriteBy:
 *                       type: integer
 *                     bookedTimes:
 *                       type: integer
 *                     pictures:
 *                       type: array
 *                       items:
 *                         type: string
 *                     rooms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           roomType:
 *                             type: string
 *                             enum: [single, double, twin, suite, deluxe, family, studio]
 *                           bedType:
 *                             type: string
 *                             enum: [single, double, queen, king, twin]
 *                           bed:
 *                             type: integer
 *                           price:
 *                             type: number
 *                           description:
 *                             type: string
 *                           facilities:
 *                             type: array
 *                             items:
 *                               type: string
 *                           availableNumber:
 *                             type: integer
 *                           bookedNumber:
 *                             type: integer
 *                             description: Number of bookings overlapping the requested dates
 *                           available:
 *                             type: integer
 *                             description: availableNumber minus bookedNumber (actual available rooms)
 *                           status:
 *                             type: string
 *                             enum: [available, occupied, maintenance, reserved]
 *                           people:
 *                             type: integer
 *                             description: Max occupancy per room
 *       400:
 *         description: Invalid hotel ID format / invalid date format / checkOutDate before checkInDate
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
 *                   example: Invalid hotel ID format
 *       404:
 *         description: Hotel not found
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
 *                   example: Hotel not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Cannot delete hotel with active bookings
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
 *                   example: "Cannot delete hotel: active bookings exist. You can delete this hotel after 2026-05-05."
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Internal server error
 */

router.use('/:hotelID/rooms',roomRouter) // override path for room under the management of hotel
router.route('/')
    .get(getManyHotels)
    .post(protect,authorize('admin'),createHotel)
router.route('/:hotelID')
    .get(getSingleHotel)
    .put(protect,authorize('admin','hotelOwner'),updateHotel)
    .delete(protect,authorize('admin'),deleteHotel)

module.exports = router;