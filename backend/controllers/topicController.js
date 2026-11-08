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
// Retrieve the first visible topic for the temporary Create Reply page
const getFirstVisibleTopic = async (req, res) => {
    try {
        const topic = await Topic.findOne({ _visible: true })
            .sort({ createdAt: 1 })
            .populate('author', 'name');
        if (!topic) {
            return res.status(404).json({
                message: 'No visible topics are currently available.'
            });
        }
        return res.status(200).json(topic);
    } catch (error) {
        console.error('Error retrieving first visible topic:', error);
        return res.status(500).json({
            message: 'Topic could not be retrieved. Please try again.'
        });
    }
};

module.exports = { createTopic, getFirstVisibleTopic };