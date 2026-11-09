const express = require('express');
const { createTopic, updateTopic, deleteTopic, getTopics, getTopicById } = require('../controllers/topicController');
const { createReply, updateReply, deleteReply } = require('../controllers/replyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createTopic); // Authenticated Members and Admins can create topics
router.post('/:topicId/replies', protect, createReply); // Authenticated Members and Admins can create replies
router.get('/', protect, getTopics); // Topic browsing and search
router.get('/:topicId', protect, getTopicById); // Retrieve a selected topic and its replies
router.put('/:topicId', protect, updateTopic); // Authenticated Members and Admins can update topics
router.delete('/:topicId', protect, deleteTopic); // Authenticated Members and Admins can delete topics
router.put('/:topicId/replies/:replyId', protect, updateReply); // Authenticated Members and Admins can update replies
router.delete('/:topicId/replies/:replyId', protect, deleteReply); // Authenticated Members and Admins can delete replies

module.exports = router;