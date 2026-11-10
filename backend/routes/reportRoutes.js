const express = require('express');
const { createReport, getMyReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/mine', protect, getMyReports); // Authenticated Members and Admins can retrieve their own Reports
router.post('/', protect, createReport); // Authenticated Members and Admins can report Topics and Replies

module.exports = router;