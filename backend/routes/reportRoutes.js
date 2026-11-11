const express = require('express');
const { createReport, getMyReports, getReports, getReportById, decideReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/mine', protect, getMyReports); // Authenticated Members and Admins can retrieve their own Reports
router.get('/', protect, adminOnly, getReports); // Admin-only get Reports from database
router.get('/:reportId', protect, adminOnly, getReportById); // Admin-only get Report by Id from database
router.put('/:reportId/decision', protect, adminOnly, decideReport) // Admin-only decide report to update a Report
router.post('/', protect, createReport); // Authenticated Members and Admins can report Topics and Replies

module.exports = router;
