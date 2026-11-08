const express = require('express');
const {getUsers, getUserById, updateUser, promoteUser, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect, adminOnly); // All user management routes require Admin authorisation
router.get('/', getUsers); // List all users
router.get('/:id', getUserById); // Retrieve one user
router.put('/:id', updateUser); // Update user profile details
router.patch('/:id/role', promoteUser); // Promote Member to Admin
router.delete('/:id', deleteUser); // Soft delete a user account

module.exports = router;
