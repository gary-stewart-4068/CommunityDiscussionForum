const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Reply = require('../models/Reply');
const Report = require('../models/Report');

// Set Topic visibility.
// Unhiding a Topic also makes every associated Reply visible.
const setTopicVisibility = async (req, res) => {
    const { topicId } = req.params;
    const { visible } = req.body;
    if (!mongoose.Types.ObjectId.isValid(topicId)) {return res.status(400).json({ message: 'Invalid topic ID' });
    }
    if (typeof visible !== 'boolean') {return res.status(400).json({message: 'Visibility must be true or false'});
    }

    let session;
    try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const topic = await Topic.findById(topicId).session(session);
            if (!topic) {const error = new Error('Topic not found'); error.statusCode = 404; throw error;
            }
            topic._visible = visible;
            await topic.save({ session });
            // Unhiding a Topic also unhides every associated Reply,
            // including Replies that were individually hidden before.
            if (visible) {
                await Reply.updateMany(
                    { topic: topic._id },
                    { $set: { _visible: true } },
                    { session }
                );
            }
        });
        return res.status(200).json({
            message: visible
                ? 'Topic and all its replies are now visible'
                : 'Topic and its replies are now hidden',
            topicId,
            visible
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({message: error.message});
        }
        console.error('Error changing Topic visibility:', error);
        return res.status(500).json({message: 'Topic visibility could not be changed. Please try again.'});
    } finally {
        if (session) {await session.endSession();}
    }
};

// Permanently delete a Topic, all its Replies and associated Reports.
const deleteTopic = async (req, res) => {
    const { topicId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(topicId)) {return res.status(400).json({ message: 'Invalid topic ID' });
    }
    let session;
    try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const topic = await Topic.findById(topicId).session(session);
            if (!topic) {const error = new Error('Topic not found'); error.statusCode = 404; throw error;
            }
            // Identify all Replies linked to this Topic.
            const replies = await Reply.find({ topic: topic._id })
                .select('_id')
                .session(session)
                .lean();
            const replyIds = replies.map((reply) => reply._id);
            // Delete Reports associated with the Topic and its Replies.
            await Report.deleteMany({
                $or: [
                    { contentType: 'Topic', contentId: topic._id },
                    { contentType: 'Reply', contentId: { $in: replyIds } }
                ]
            }).session(session);
            // Delete all Replies and then the Topic.
            await Reply.deleteMany({ topic: topic._id }).session(session);
            await Topic.deleteOne({ _id: topic._id }).session(session);
        });
        return res.status(200).json({message: 'Topic, its replies and associated Reports deleted successfully'});
    } catch (error) {
        if (error.statusCode) {return res.status(error.statusCode).json({message: error.message});
        }
        console.error('Error deleting Topic through moderation:', error);
        return res.status(500).json({message: 'Topic and its replies could not be deleted. Please try again.'});
    } finally {
        if (session) {await session.endSession();}
    }
};

// Set visibility for an individual Reply.
const setReplyVisibility = async (req, res) => {
    const { topicId, replyId } = req.params;
    const { visible } = req.body;
    if (
        !mongoose.Types.ObjectId.isValid(topicId) ||
        !mongoose.Types.ObjectId.isValid(replyId)
    ) {
        return res.status(400).json({message: 'Invalid topic or reply ID'});
    }
    if (typeof visible !== 'boolean') {return res.status(400).json({message: 'Visibility must be true or false'});
    }
    try {
        const reply = await Reply.findOne({_id: replyId, topic: topicId});
        if (!reply) {return res.status(404).json({ message: 'Reply not found' });}
        reply._visible = visible;
        await reply.save();
        return res.status(200).json({
            message: visible
                ? 'Reply is now visible'
                : 'Reply is now hidden',
            replyId,
            visible
        });
    } catch (error) {
        console.error('Error changing Reply visibility:', error);
        return res.status(500).json({message: 'Reply visibility could not be changed. Please try again.'});
    }
};

// Permanently delete a Reply and its associated Reports.
const deleteReply = async (req, res) => {
    const { topicId, replyId } = req.params;
    if (
        !mongoose.Types.ObjectId.isValid(topicId) ||
        !mongoose.Types.ObjectId.isValid(replyId)
    ) {
        return res.status(400).json({message: 'Invalid topic or reply ID'});
    }
    let session;
    try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const reply = await Reply.findOne({_id: replyId, topic: topicId}).session(session);
            if (!reply) {const error = new Error('Reply not found'); error.statusCode = 404; throw error;
            }
            // Delete Reports associated with this Reply.
            await Report.deleteMany({contentType: 'Reply', contentId: reply._id}).session(session);
            await Reply.deleteOne({ _id: reply._id }).session(session);
        });
        return res.status(200).json({message: 'Reply and its associated Reports deleted successfully'});
    } catch (error) {
        if (error.statusCode) {return res.status(error.statusCode).json({message: error.message});
        }
        console.error('Error deleting Reply through moderation:', error);
        return res.status(500).json({message: 'Reply could not be deleted. Please try again.'});
    } finally {
        if (session) {await session.endSession();}
    }
};

module.exports = {setTopicVisibility, deleteTopic, setReplyVisibility, deleteReply};
