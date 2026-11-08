
const mongoose = require('mongoose');
const User = require('../models/User');

// Normalise email addresses
const normaliseEmail = (email) => email.trim().toLowerCase();

// Validate email addresses
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Check for duplicate email errors
const isDuplicateEmailError = (error) => error.code === 11000;

// Return user details without password
const formatUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    _deleted: user._deleted
});

// Retrieve all users (Admin only)
const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ name: 1 });
        return res.status(200).json(users.map(formatUser));
    } catch (error) {
        console.error('Error retrieving users:', error);
        return res.status(500).json({
            message: 'Unable to retrieve users. Please try again.'
        });
    }
};

// Retrieve one user (Admin only)
const getUserById = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(formatUser(user));
    } catch (error) {
        console.error('Error retrieving user:', error);
        return res.status(500).json({
            message: 'Unable to retrieve user. Please try again.'
        });
    }
};

// Update another user's name and email (Admin only)
const updateUser = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: 'Please provide at least one profile field to update'
        });
    }
    const allowedFields = ['name', 'email'];
    const suppliedFields = Object.keys(req.body);
    if (suppliedFields.some(field => !allowedFields.includes(field))) {
        return res.status(400).json({
            message: 'Only name and email can be updated here'
        });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
            if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
                return res.status(400).json({ message: 'Name cannot be empty' });
            }
            user.name = req.body.name.trim();
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
            if (typeof req.body.email !== 'string' || !req.body.email.trim()) {
                return res.status(400).json({ message: 'Email cannot be empty' });
            }
            const cleanEmail = normaliseEmail(req.body.email);
            if (!isValidEmail(cleanEmail)) {
                return res.status(400).json({
                    message: 'Please enter a valid email address'
                });
            }
            user.email = cleanEmail;
        }
        const updatedUser = await user.save();
        return res.status(200).json(formatUser(updatedUser));
    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return res.status(409).json({
                message: 'User with this email already exists'
            });
        }
        console.error('Error updating user:', error);
        return res.status(500).json({
            message: 'User update failed. Please try again.'
        });
    }
};

// Promote a Member to Admin (Admin only)
const promoteUser = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user._deleted) {
            return res.status(400).json({
                message: 'A deleted account cannot be promoted'
            });
        }
        if (user.role === 'Admin') {
            return res.status(400).json({
                message: 'This user is already an Admin'
            });
        }
        user.role = 'Admin';
        const updatedUser = await user.save();
        return res.status(200).json({
            message: 'User successfully promoted to Admin',
            user: formatUser(updatedUser)
        });
    } catch (error) {
        console.error('Error promoting user:', error);
        return res.status(500).json({
            message: 'User promotion failed. Please try again.'
        });
    }
};

// Soft delete a user account (Admin only)
const deleteUser = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {return res.status(404).json({message: 'User not found'});
        }
        if (user._deleted) {return res.status(400).json({message: 'This account has already been deleted'});
        }
        // Prevent deletion of the last active Admin
        if (user.role === 'Admin') {
            const activeAdminCount = await User.countDocuments({role: 'Admin', _deleted: false});
            if (activeAdminCount <= 1) {return res.status(400).json({message: 'The last active Admin account cannot be deleted'});}
        }
        // Soft delete: retain the account and associated content
        user._deleted = true;
        const deletedUser = await user.save();
        return res.status(200).json({message: 'User account successfully deleted',user: formatUser(deletedUser)});
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({message: 'User deletion failed. Please try again.'});
    }
};

module.exports = {getUsers, getUserById, updateUser, promoteUser, deleteUser};
