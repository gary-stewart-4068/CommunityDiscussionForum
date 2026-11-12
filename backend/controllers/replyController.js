const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Reply = require('../models/Reply');
const Report = require('../models/Report');

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

// Delete a reply owned by the authenticated user and its associated Reports
const deleteReply = async (req, res) => {
    const { topicId, replyId } = req.params;
    // Validate the Topic and Reply IDs
    if (
        !mongoose.Types.ObjectId.isValid(topicId) ||
        !mongoose.Types.ObjectId.isValid(replyId)
    ) {
        return res.status(400).json({message: 'Invalid topic or reply ID' });
    }
    let session;
    try {
        session = await mongoose.startSession();
        let replyFound = false;
        await session.withTransaction(async () => {
            replyFound = false;
            // Find the Reply and verify ownership and Topic relationship
            const reply = await Reply.findOne({
                _id: replyId, topic: topicId, author: req.user.id }).session(session);
            if (!reply) { return; }
            replyFound = true;
            // Delete Reports associated with this Reply
            await Report.deleteMany({contentType: 'Reply', contentId: reply._id }).session(session);
            // Delete the Reply
            await Reply.deleteOne({ _id: reply._id }).session(session);
        });
        if (!replyFound) {return res.status(404).json({message: 'Reply not found or you are not authorised to delete it' });}
        return res.status(200).json({message: 'Reply deleted successfully' });
    } catch (error) {
        console.error('Error deleting reply:', error);
        return res.status(500).json({ message: 'Reply could not be deleted. Please try again.' });
    } finally {
        if (session) { await session.endSession(); }
    }
};

module.exports = { createReply, updateReply, deleteReply };
