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
 *           description: Hotel ID (ref Hotel)
 *         roomType:
 *           type: string
 *           enum: [single, double, twin, suite, deluxe, family, studio]
 *         bedType:
 *           type: string
 *           enum: [single, double, queen, king, twin]
 *         bed:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         price:
 *           type: number
 *           minimum: 0
 *         description:
 *           type: string
 *           maxLength: 1000
 *           default: ''
 *         picture:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 10
 *           default: []
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *             enum: [wifi, air_conditioning, heating, tv, minibar, safe, bathroom, balcony, kitchen, shower, bathtub, hairdryer, iron, desk, sofa, telephone, coffee_maker, dining_area, work_area, room_service]
 *           default: []
 *         availableNumber:
 *           type: integer
 *           minimum: 0
 *         status:
 *           type: string
 *           enum: [available, occupied, maintenance, reserved]
 *           default: available
 *         people:
 *           type: integer
 *           minimum: 1
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelID}/rooms:
 *   get:
 *     summary: Get all rooms in hotel
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
 *                     $ref: '#/components/schemas/Room'
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create room
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
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelID}/rooms/{roomID}:
 *   get:
 *     summary: Get single room
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
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Room does not belong to this hotel
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update room
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
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Validation error or room does not belong to this hotel
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete room
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