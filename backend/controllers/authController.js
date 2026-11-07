
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const normaliseEmail = (email) => {return email.trim().toLowerCase();};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isDuplicateEmailError = (error) => {
    return error.code === 11000;
};

// this registers a new Member in the database
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (
        typeof name !== 'string' || !name.trim() ||
        typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || !password
    ) {
        return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const cleanEmail = normaliseEmail(email);

    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    try {
        const userExists = await User.findOne({ email: cleanEmail });
        if (userExists) return res.status(409).json({ message: 'User already exists' });

        const user = await User.create({ name, email: cleanEmail, password, role: 'Member', _deleted: false });
        res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user.id) });
    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        console.error('Error registering user:', error);

        res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
};

//
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (
        typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || !password
    ) {
        return res.status(400).json({ message: 'Please provide a valid email and password' });
    }

    try {
        const cleanEmail = normaliseEmail(email);
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });
        if (user._deleted) return res.status(403).json({ message: 'This account is no longer active. Please contact an administrator.' });

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id) });

    } catch (error) {
        console.error('Error logging in user:', error);

        return res.status(500).json({ message: 'Sign-in could not be completed. Please try again.' });
    }
};

// Retrieve authenticated user's profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user || user._deleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });

    } catch (error) {
        console.error('Error retrieving user profile:', error);
        return res.status(500).json({ message: 'An error occurred while retrieving the profile. Please try again.' });
    }
  };

// Update authenticated user's profile
const updateUserProfile = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Please provide at least one profile field to update' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user || user._deleted) return res.status(404).json({ message: 'User not found' });

        // Only user can update their name and email. Role and _deleted status are not updatable by the user.

        // Role and deleted status can only be changed through Admin User Management.
        if (
            Object.prototype.hasOwnProperty.call(req.body, 'role') ||
            Object.prototype.hasOwnProperty.call(req.body, '_deleted')
        ) {
            return res.status(403).json({
                message: 'You are not authorised to change account role or status here'
            });
        }

        // Reject requests that contain no supported profile fields.
        const allowedFields = ['name', 'email'];
        const hasAllowedField = allowedFields.some(field =>
            Object.prototype.hasOwnProperty.call(req.body, field)
        );

        if (!hasAllowedField) {
            return res.status(400).json({
                message: 'Please provide a name or email address to update'
            });
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
                return res.status(400).json({ message: 'Please enter a valid email address' });
            }
            user.email = cleanEmail;
        }

        const updatedUser = await user.save();
        return res.status(200).json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser.id)
        });

    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        console.error('Error updating user profile:', error);
        return res.status(500).json({ message: 'Profile update failed. Please try again.' });
    }
};

// Change the authenticated user's password
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (
        typeof currentPassword !== 'string' || !currentPassword ||
        typeof newPassword !== 'string' || !newPassword
    ) {
        return res.status(400).json({ message: 'Please provide both current and new passwords' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user || user._deleted) return res.status(404).json({ message: 'User not found' });

        const passwordMatches = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();
        return res.status(200).json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ message: 'Password change failed. Please try again.' });
    }
};

module.exports = { registerUser, loginUser, updateUserProfile, getProfile, changePassword };