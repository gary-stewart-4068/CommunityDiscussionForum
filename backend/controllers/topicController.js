const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Reply = require('../models/Reply');
const Report = require('../models/Report');

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

// Update a topic owned by the authenticated user
const updateTopic = async (req, res) => {
    const { topicId } = req.params;
    const { title, content } = req.body;
    // Validate the Topic ID
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
        return res.status(400).json({ message: 'Invalid topic ID' });
    }
    // Require at least one editable field
    if (title === undefined && content === undefined) {
        return res.status(400).json({
            message: 'Please provide a topic title or content to update'
        });
    }
    // Validate supplied fields
    if (
        (title !== undefined && (typeof title !== 'string' || !title.trim())) ||
        (content !== undefined && (typeof content !== 'string' || !content.trim()))
    ) {
        return res.status(400).json({message: 'Topic title and content cannot be empty' });
    }
    try {
        // Find the Topic and verify ownership
        const topic = await Topic.findOne({_id: topicId, author: req.user.id });
        if (!topic) {
            return res.status(404).json({message: 'Topic not found or you are not authorised to update it' });
        }
        // Update only the supplied editable fields
        if (title !== undefined) {topic.title = title.trim(); }
        if (content !== undefined) { topic.content = content.trim(); }
        await topic.save();
        return res.status(200).json(topic);
    } catch (error) {
        console.error('Error updating topic:', error);
        return res.status(500).json({message: 'Topic could not be updated. Please try again.' });
    }
};

// Delete a topic owned by the authenticated user, all its replies and all associated Reports
const deleteTopic = async (req, res) => {
    const { topicId } = req.params;
    // Validate the Topic ID
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
        return res.status(400).json({message: 'Invalid topic ID' }); }
    let session;
    try {
        session = await mongoose.startSession();
        let topicFound = false;
        await session.withTransaction(async () => {
            topicFound = false;
            // Find the Topic and verify ownership
            const topic = await Topic.findOne({_id: topicId, author: req.user.id }).session(session);
            if (!topic) {return; }
            topicFound = true;
            // Identify all Replies linked to this Topic
            const replies = await Reply.find({ topic: topic._id }).select('_id').session(session).lean();
            const replyIds = replies.map((reply) => reply._id);
            // Delete Reports associated with the Topic and its Replies
            await Report.deleteMany({
                $or: [
                    { contentType: 'Topic', contentId: topic._id },
                    { contentType: 'Reply', contentId: { $in: replyIds } }
                ]
            }).session(session);
            // Delete every Reply linked to this Topic
            await Reply.deleteMany({topic: topic._id }).session(session);
            // Delete the Topic
            await Topic.deleteOne({_id: topic._id }).session(session);
        });
        if (!topicFound) {
            return res.status(404).json({message: 'Topic not found or you are not authorised to delete it' }); }
        return res.status(200).json({message: 'Topic and its replies deleted successfully' });
    } catch (error) {
        console.error('Error deleting topic:', error);
        return res.status(500).json({message: 'Topic and its replies could not be deleted. Please try again.' });
    } finally {
        if (session) {await session.endSession(); } }
};

// Retrieve and search topics for the authenticated user
const getTopics = async (req, res) => {
    const isAdmin = req.user.role === 'Admin';
    const searchQuery = req.query.q;
    // Validate search input
    if (searchQuery !== undefined && typeof searchQuery !== 'string') {
        return res.status(400).json({ message: 'Invalid search query' });
    }
    // Validate the Admin visibility filter
    const visibility = req.query.visibility || 'all';
    if (isAdmin && !['all', 'visible', 'hidden'].includes(visibility)) {
        return res.status(400).json({ message: 'Invalid visibility filter' });
    }
    try {
        const topicFilter = {};
        // Members can only retrieve visible topics
        if (!isAdmin) {
            topicFilter._visible = true;
        } else if (visibility === 'visible') {
            topicFilter._visible = true;
        } else if (visibility === 'hidden') {
            topicFilter._visible = false;
        }
        const trimmedQuery = searchQuery?.trim();
        if (trimmedQuery) {
            // Escape special characters so the search is treated as literal text
            const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escapedQuery, 'i');
            // Find replies matching the search query
            const replyFilter = { content: searchRegex };
            // Members can only search visible replies
            if (!isAdmin) {
                replyFilter._visible = true;
            }
            const matchingReplyTopicIds = await Reply.distinct('topic', replyFilter);
            // Include topics matching their own text or containing a matching reply
            topicFilter.$or = [
                { title: searchRegex },
                { content: searchRegex },
                { _id: { $in: matchingReplyTopicIds } }
            ];
        }
        const topics = await Topic.find(topicFilter)
            .sort({ createdAt: -1 })
            .populate('author', 'name');
        // Retrieve reply counts for the returned topics
        const topicIds = topics.map((topic) => topic._id);
        const replyCountFilter = { topic: { $in: topicIds } };
        if (!isAdmin) {
            replyCountFilter._visible = true;
        }
        const replyCounts = await Reply.aggregate([
            { $match: replyCountFilter },
            { $group: { _id: '$topic', count: { $sum: 1 } } }
        ]);
        const replyCountMap = new Map(
            replyCounts.map((item) => [item._id.toString(), item.count])
        );
        const results = topics.map((topic) => ({
            ...topic.toObject(),
            replyCount: replyCountMap.get(topic._id.toString()) || 0
        }));
        return res.status(200).json(results);
    } catch (error) {
        console.error('Error retrieving topics:', error);
        return res.status(500).json({
            message: 'Topics could not be retrieved. Please try again.'
        });
    }
};
// Retrieve a topic and its replies
const getTopicById = async (req, res) => {
    const { topicId } = req.params;
    const isAdmin = req.user.role === 'Admin';
    // Validate the Topic ID
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
        return res.status(400).json({ message: 'Invalid topic ID' });
    }
    try {
        // Members can only retrieve visible topics
        const topicFilter = { _id: topicId };
        if (!isAdmin) {
            topicFilter._visible = true;
        }
        const topic = await Topic.findOne(topicFilter)
            .populate('author', 'name');
        if (!topic) {
            return res.status(404).json({
                message: 'Topic not found or is not available'
            });
        }
        // Retrieve replies belonging to this topic
        const replyFilter = { topic: topic._id };
        // Members can only retrieve visible replies
        if (!isAdmin) {
            replyFilter._visible = true;
        }
        const replies = await Reply.find(replyFilter)
            .sort({ createdAt: 1 })
            .populate('author', 'name');
        return res.status(200).json({ topic, replies });
    } catch (error) {
        console.error('Error retrieving topic:', error);
        return res.status(500).json({
            message: 'Topic could not be retrieved. Please try again.'
        });
    }
};

module.exports = { createTopic, deleteTopic, getTopics, getTopicById, updateTopic };