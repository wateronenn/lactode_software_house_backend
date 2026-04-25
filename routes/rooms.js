const express = require('express');
const { getManyRooms,getSingleRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/rooms');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       required:
 *         - hotelID
 *         - roomType
 *         - bedType
 *         - bed
 *         - price
 *         - availableNumber
 *         - people
 *       properties:
 *         _id:
 *           type: string
 *         hotelID:
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
 *         picture:
 *           type: array
 *           items:
 *             type: string
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *         availableNumber:
 *           type: integer
 *         bookedNumber:
 *           type: integer
 *           description: Number of bookings overlapping the requested dates
 *         available:
 *           type: integer
 *           description: availableNumber minus bookedNumber (actual available rooms)
 *         status:
 *           type: string
 *           enum: [available, occupied, maintenance, reserved]
 *         people:
 *           type: integer
 *           description: Max occupancy per room
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelID}/rooms:
 *   get:
 *     summary: Get all rooms in a hotel with optional availability filter
 *     tags: [Rooms]
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
 *         description: Minimum room capacity required
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid date format or checkOutDate before checkInDate
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
 *                   example: Invalid date format
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a room (Admin / Hotel Owner)
 *     tags: [Rooms]
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
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       201:
 *         description: Room created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner of this hotel
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelID}/rooms/{roomID}:
 *   get:
 *     summary: Get a single room
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roomID
 *         required: true
 *         schema:
 *           type: string
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
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Room does not belong to this hotel
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 *
 *   put:
 *     summary: Update a room (Admin / Hotel Owner)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roomID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Room does not belong to this hotel or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner of this hotel
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete a room (Admin / Hotel Owner)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roomID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
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
 *                   example: {}
 *       400:
 *         description: Active bookings exist - cannot delete yet
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
 *                   example: "Cannot delete room: active bookings exist. You can delete after 2025-06-05"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not owner of this hotel
 *       404:
 *         description: Room or hotel not found
 *       500:
 *         description: Internal server error
 */

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getManyRooms)
    .post(protect, authorize('hotelOwner','admin'), createRoom)

router.route('/:roomID')
    .get(getSingleRoom)
    .put(protect, authorize('hotelOwner','admin'), updateRoom)
    .delete(protect, authorize('hotelOwner','admin'), deleteRoom)

module.exports = router;