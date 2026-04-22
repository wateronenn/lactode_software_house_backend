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
 *         status:
 *           type: string
 *           enum: [available, occupied, maintenance, reserved]
 *         people:
 *           type: integer
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelID}/rooms:
 *   get:
 *     summary: Get all rooms in a hotel
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: hotelID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *       404:
 *         description: Room not found
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
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