const express = require('express');
const {register,login,getMe, logout,resetPassword,updateUser} = require('../controllers/auth');
const router = express.Router();
const {protect} = require('../middleware/auth');

router.post('/register',register);
router.post('/login',login);
router.get('/me',protect,getMe);
router.get('/logout',logout,);
router.post('/resetPassword',protect,resetPassword);
router.put('/updateUser',protect,updateUser);

module.exports = router;