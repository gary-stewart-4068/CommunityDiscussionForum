const Topic = require('../models/Topic');

// Create a new topic for the authenticated user
const createTopic = async (req, res) => {
    const { title, content } = req.body;
    // Validate required fields before attempting database creation
    if (
        typeof title !== 'string' || !title.trim() ||
        typeof content !== 'string' || !content.trim()
    ) {
        return res.status(400).json({message: 'Please provide a topic title and content'});
    }
    try {
        const topic = await Topic.create({author: req.user.id, title: title.trim(), content: content.trim()});
        return res.status(201).json(topic);
    } catch (error) {
        console.error('Error creating topic:', error);
        return res.status(500).json({message: 'Topic could not be created. Please try again.'});
    }
};

module.exports = { createTopic };