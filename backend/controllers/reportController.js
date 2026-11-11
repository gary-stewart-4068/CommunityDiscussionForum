
const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Reply = require('../models/Reply');
const Report = require('../models/Report');
const User = require('../models/User');

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

// Build the Report details for Admin review.
// Direct database lookups deliberately include hidden content.
const buildReportDetails = async (report) => {
    const [reporter] = await Promise.all([User.findById(report.reporter).select('name').lean()]);
    let content = null;
    let topic = null;
    if (report.contentType === 'Topic') {content = await Topic.findById(report.contentId).populate('author', 'name').lean();
    } else if (report.contentType === 'Reply') {content = await Reply.findById(report.contentId).populate('author', 'name').lean();
        if (content) {topic = await Topic.findById(content.topic).populate('author', 'name').lean();}
    }
    return {...report, reporter: reporter || null, content, topic};
};

// Retrieve all Reports for Admin review
const getReports = async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 }).lean();
        const reportDetails = await Promise.all(reports.map(report => buildReportDetails(report)));
        return res.status(200).json(reportDetails);
    } catch (error) {
        console.error('Error retrieving Reports for Admin review:', error);
        return res.status(500).json({message: 'Reports could not be retrieved. Please try again.'});
    }
};

// Retrieve an individual Report for Admin review
const getReportById = async (req, res) => {
    const { reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return res.status(400).json({ message: 'Invalid Report ID' });
    }
    try {
        const report = await Report.findById(reportId).lean();
        if (!report) {return res.status(404).json({ message: 'Report not found' });}
        const reportDetails = await buildReportDetails(report);
        return res.status(200).json(reportDetails);
    } catch (error) {
        console.error('Error retrieving Report:', error);
        return res.status(500).json({message: 'Report could not be retrieved. Please try again.'});
    }
};

// Approve or reject a Report.
// The Report decision and any resulting visibility change are atomic.
const decideReport = async (req, res) => {
    const { reportId } = req.params;
    const { decision } = req.body;
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return res.status(400).json({ message: 'Invalid Report ID' });
    }
    if (!['Approved', 'Rejected'].includes(decision)) {
        return res.status(400).json({message: 'Decision must be Approved or Rejected'});
    }
    let session;
    try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {const report = await Report.findById(reportId).session(session);
            if (!report) {const error = new Error('Report not found'); error.statusCode = 404; throw error;}
            if (report.decision !== 'Open') {const error = new Error('This Report has already been resolved'); error.statusCode = 409; throw error;}
            // Confirm that the reported content still exists.
            let content;
            if (report.contentType === 'Topic') {content = await Topic.findById(report.contentId).session(session);
            } else {content = await Reply.findById(report.contentId).session(session);}
            if (!content) {const error = new Error('The reported content could not be found'); error.statusCode = 404; throw error;}
            // Approval automatically hides the reported content.
            if (decision === 'Approved') {
                if (report.contentType === 'Topic') {
                    await Topic.updateOne(
                        { _id: report.contentId },
                        { $set: { _visible: false } },
                        { session }
                    );
                } else {
                    await Reply.updateOne(
                        { _id: report.contentId },
                        { $set: { _visible: false } },
                        { session }
                    );
                }
            }
            // Only an Open Report can be resolved.
            // If another request has already resolved it, the transaction fails.
            const updateResult = await Report.updateOne(
                { _id: reportId, decision: 'Open' },
                {
                    $set: {
                        decision,
                        decider: req.user._id,
                        decidedAt: new Date()
                    }
                },
                { session }
            );
            const matchedCount = updateResult.matchedCount ?? updateResult.n;
            if (matchedCount !== 1) {const error = new Error('This Report has already been resolved'); error.statusCode = 409; throw error;}
        });
        const resolvedReport = await Report.findById(reportId).lean();
        const reportDetails = await buildReportDetails(resolvedReport);
        return res.status(200).json(reportDetails);
    } catch (error) {if (error.statusCode) {return res.status(error.statusCode).json({ message: error.message });}
        console.error('Error resolving Report:', error);
        return res.status(500).json({message: 'The Report decision could not be saved. Please try again.'});
    } finally {if (session) {await session.endSession();}
    }
};

module.exports = { createReport, getMyReports, getReports, getReportById, decideReport };
