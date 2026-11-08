const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');
const Module = require('module');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const createInitialAdmin = async () => {
    // Check whether a valid Admin account already exists
    const existingAdmin = await User.findOne({
        role: 'Admin',
        _deleted: false
    });

    if (existingAdmin) {
        console.log('An active Admin account already exists.');
        return;
    }

    // Read initial Admin credentials
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error(
            'ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be provided'
        );
    }

    // Create the initial Admin account
    const admin = await User.create({
        name: ADMIN_NAME.trim(),
        email: ADMIN_EMAIL.trim().toLowerCase(),
        password: ADMIN_PASSWORD,
        role: 'Admin',
        _deleted: false
    });

    console.log(`Initial Admin account created successfully: ${admin.email}`);
};

module.exports = createInitialAdmin;