const express = require('express');
const {getAllUsers,register,login,getMe, logout,resetPassword,updateUser} = require('../controllers/auth');
const router = express.Router();
const {protect , authorize} = require('../middleware/auth');
/**
 * @swagger
 * /api/v1/auth:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 */

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   put:
 *     summary: Reset password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, rePassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               rePassword:
 *                 type: string
 */

/**
 * @swagger
 * /api/v1/auth/update-user:
 *   put:
 *     summary: Update user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               tel:
 *                 type: string
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               picture:
 *                 type: string
 */
router.post('/register',register);
router.post('/login',login);
router.get('/',protect,authorize('admin'),getAllUsers);
router.get('/me',protect,getMe);
router.get('/logout',logout,);
router.put('/resetPassword',protect,resetPassword);
router.put('/updateUser',protect,updateUser);

module.exports = router;

