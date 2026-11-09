const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Reply = require('../models/Reply');

// Create a new reply for the authenticated user
const createReply = async (req, res) => {
    const { topicId } = req.params;
    const { content } = req.body;
    // Validate the Topic ID
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
        return res.status(400).json({ message: 'Invalid topic ID' });
    }
    // Validate reply content
    if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ message: 'Please provide reply content' });
    }
    try {
        // Only allow replies on existing visible topics
        const topic = await Topic.findOne({_id: topicId, _visible: true });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found or is not available' });
        }
        // Create reply using the authenticated user's ID
        const reply = await Reply.create({ topic: topic._id, author: req.user.id, content: content.trim() });
        await reply.populate('author', 'name');
        return res.status(201).json(reply);
    } catch (error) {
        console.error('Error creating reply:', error);
        return res.status(500).json({ message: 'Reply could not be created. Please try again.' });
    }
};

module.exports = { createReply };