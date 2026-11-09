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

// Update a reply owned by the authenticated user
const updateReply = async (req, res) => {
    const { topicId, replyId } = req.params;
    const { content } = req.body;
    // Validate the Topic and Reply IDs
    if (
        !mongoose.Types.ObjectId.isValid(topicId) ||
        !mongoose.Types.ObjectId.isValid(replyId)
    ) {
        return res.status(400).json({ message: 'Invalid topic or reply ID' });
    }
    // Validate reply content
    if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({message: 'Please provide reply content' });
    }
    try {
        // Find the Reply and verify ownership and Topic relationship
        const reply = await Reply.findOne({_id: replyId, topic: topicId, author: req.user.id });
        if (!reply) {
            return res.status(404).json({message: 'Reply not found or you are not authorised to update it' });
        }
        reply.content = content.trim();
        await reply.save();
        await reply.populate('author', 'name');
        return res.status(200).json(reply);
    } catch (error) {
        console.error('Error updating reply:', error);
        return res.status(500).json({message: 'Reply could not be updated. Please try again.' });
    }
};

// Delete a reply owned by the authenticated user
const deleteReply = async (req, res) => {
    const { topicId, replyId } = req.params;
    // Validate the Topic and Reply IDs
    if (
        !mongoose.Types.ObjectId.isValid(topicId) ||
        !mongoose.Types.ObjectId.isValid(replyId)
    ) {
        return res.status(400).json({message: 'Invalid topic or reply ID' }); }
    try {
        // Find the Reply and verify ownership and Topic relationship
        const reply = await Reply.findOne({_id: replyId, topic: topicId, author: req.user.id });

        if (!reply) {
            return res.status(404).json({message: 'Reply not found or you are not authorised to delete it' }); }
        await Reply.deleteOne({ _id: reply._id });
        return res.status(200).json({message: 'Reply deleted successfully' });
    } catch (error) {
        console.error('Error deleting reply:', error);
        return res.status(500).json({ message: 'Reply could not be deleted. Please try again.' }); }
};

module.exports = { createReply, updateReply, deleteReply };