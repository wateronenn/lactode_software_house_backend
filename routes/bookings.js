const express = require("express");

const { getManyBookings, getSingleBooking, addBooking, updateBooking, deleteBooking } = require("../controllers/bookings");

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - user
 *         - hotelID
 *         - roomID
 *         - checkInDate
 *         - checkOutDate
 *       properties:
 *         _id:
 *           type: string
 *         bookingID:
 *           type: string
 *         user:
 *           type: string
 *           description: User ID (ref User)
 *         hotelID:
 *           type: string
 *           description: Hotel ID (ref Hotel)
 *         roomID:
 *           type: string
 *           description: Room ID (ref Room)
 *         checkInDate:
 *           type: string
 *           format: date
 *         checkOutDate:
 *           type: string
 *           format: date
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get bookings (admin=all, hotelOwner=own hotels, user=own bookings)
 *     tags: [Bookings]
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
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create booking (max 3 days for non-admin)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hotelID, roomID, checkInDate, checkOutDate]
 *             properties:
 *               hotelID:
 *                 type: string
 *               roomID:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request or booking exceeds 3 days
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get single booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid booking ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update booking dates only (max 3 days for non-admin)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
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
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Bad request or booking exceeds 3 days
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */

router.route("/")
    .get(protect, getManyBookings)
    .post(protect, authorize('admin','hotelOwner','user'),addBooking);

router.route('/:id')
    .get(protect,getSingleBooking)
    .put(protect, authorize('admin','hotelOwner','user'),updateBooking)
    .delete(protect, authorize('admin','hotelOwner','user'),deleteBooking);

module.exports = router;