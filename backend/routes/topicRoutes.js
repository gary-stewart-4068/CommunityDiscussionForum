const express = require('express');
const { createTopic, getFirstVisibleTopic } = require('../controllers/topicController');
const { createReply } = require('../controllers/replyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createTopic); // Authenticated Members and Admins can create topics
router.post('/:topicId/replies', protect, createReply); // Authenticated Members and Admins can create replies
router.get('/first-visible', protect, getFirstVisibleTopic); // Retrieve the first visible topic for the authenticated user

module.exports = router;