const express = require('express');
const { createTopic, getTopics, getTopicById } = require('../controllers/topicController');
const { createReply } = require('../controllers/replyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createTopic); // Authenticated Members and Admins can create topics
router.post('/:topicId/replies', protect, createReply); // Authenticated Members and Admins can create replies
router.get('/', protect, getTopics); // Topic browsing and search
router.get('/:topicId', protect, getTopicById); // Retrieve a selected topic and its replies

module.exports = router;