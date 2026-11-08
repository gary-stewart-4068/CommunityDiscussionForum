
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, please sign in' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, please sign in' });
    }
    let decoded;

    // Verify the JWT separately from the database query to handle invalid tokens gracefully
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ message: 'Your session is invalid or expired. Please sign in again' });
    }

    // Confirm that account still exists and is active
    try {
        const user = await User.findById(decoded.id).select('-password');
        if (!user || user._deleted) {
            return res.status(401).json({ message: 'User account is no longer active. Please contact an administrator' });
        }
        req.user = user; // Attach the user object to the request for downstream use
        return next();

    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ message: 'Authentication could not be completed. Please try again later' });
    }
};

const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, please sign in' });
    }
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Administrator privileges required' });
    }
    next();
};

module.exports = { protect, adminOnly };
