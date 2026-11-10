
const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Reply = require('../models/Reply');
const Report = require('../models/Report');

// Create a report against a visible Topic or Reply
const createReport = async (req, res) => {
    const { contentType, contentId, reason } = req.body;

    // Validate content type
    if (!['Topic', 'Reply'].includes(contentType)) {return res.status(400).json({message: 'Content type must be Topic or Reply'});}

    // Validate content ID
    if (typeof contentId !== 'string' || !mongoose.Types.ObjectId.isValid(contentId)) {return res.status(400).json({message: 'Invalid content ID'});}

    // Validate report reason
    if (typeof reason !== 'string' || !reason.trim()) {return res.status(400).json({message: 'Please provide a report reason'});}

    if (reason.trim().length > 1000) {return res.status(400).json({message: 'Report reason cannot exceed 1000 characters'});}

    try {
        // Confirm the reported content exists and is visible
        if (contentType === 'Topic') {
            const topic = await Topic.findOne({_id: contentId, _visible: true});
            if (!topic) {return res.status(404).json({message: 'Content not found or is not available'});}
        } else {
            const reply = await Reply.findOne({_id: contentId, _visible: true});
            if (!reply) {return res.status(404).json({message: 'Content not found or is not available'});}
            // A Reply is only reportable if its parent Topic is visible
            const topic = await Topic.findOne({_id: reply.topic, _visible: true});

            if (!topic) {return res.status(404).json({message: 'Content not found or is not available'});}
        }

        // Create the report using the authenticated user's ID
        const report = await Report.create({contentType, contentId, reporter: req.user.id, reason: reason.trim()});
        return res.status(201).json(report);

    } catch (error) {
        // The compound unique index prevents duplicate reports
        if (error.code === 11000) {return res.status(409).json({message: 'You have already reported this content'});}
        console.error('Error creating report:', error);
        return res.status(500).json({message: 'Report could not be created. Please try again.'});
    }
};

// Retrieve Reports submitted by the authenticated user
const getMyReports = async (req, res) => {
    try {const reports = await Report.find({ reporter: req.user.id }).select('contentType contentId').lean();
        return res.status(200).json(reports);
    } catch (error) {
        console.error('Error retrieving user reports:', error);
        return res.status(500).json({message: 'Your reports could not be retrieved. Please try again.'});
    }
};

module.exports = { createReport, getMyReports };
