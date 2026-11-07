
const express = require('express');
const { registerUser, loginUser, updateUserProfile, getProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Public authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes for user profile management
router.put('/change-password', protect, changePassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
