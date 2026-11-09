const Topic = require('../models/Topic');
const Reply = require('../models/Reply');

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
    if (!require('mongoose').Types.ObjectId.isValid(topicId)) {
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

module.exports = { createTopic, getTopics, getTopicById };