const express = require('express');
const { createTopic, updateTopic, deleteTopic, getTopics, getTopicById } = require('../controllers/topicController');
const { createReply, updateReply, deleteReply } = require('../controllers/replyController');
const { setTopicVisibility, deleteTopic: adminDeleteTopic, setReplyVisibility, deleteReply: adminDeleteReply} = require('../controllers/moderationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin moderation routes
router.put('/:topicId/visibility', protect, adminOnly, setTopicVisibility);
router.delete('/admin/:topicId', protect, adminOnly, adminDeleteTopic);
router.put('/:topicId/replies/:replyId/visibility', protect, adminOnly, setReplyVisibility);
router.delete('/admin/:topicId/replies/:replyId', protect, adminOnly, adminDeleteReply);
// Topic routes
router.post('/', protect, createTopic); // Authenticated users can create topics
router.get('/', protect, getTopics); // Topic browsing and search
router.get('/:topicId', protect, getTopicById); // Retrieve a selected topic and its replies
router.put('/:topicId', protect, updateTopic); // Authenticated users can update topics
router.delete('/:topicId', protect, deleteTopic); // Authenticated users can delete topics
// Reply routes
router.post('/:topicId/replies', protect, createReply); // Authenticated users can create replies
router.put('/:topicId/replies/:replyId', protect, updateReply); // Authenticated users can update replies
router.delete('/:topicId/replies/:replyId', protect, deleteReply); // Authenticated users can delete replies

module.exports = router;