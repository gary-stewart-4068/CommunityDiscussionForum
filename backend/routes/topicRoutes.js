const express = require('express');
const { createTopic } = require('../controllers/topicController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Authenticated Members and Admins can create topics
router.post('/', protect, createTopic);

module.exports = router;