
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    contentType: { type: String, enum: ['Topic', 'Reply'], required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
        type: String,
        required: [true, 'Reason why content is inappropriate is required'],
        trim: true,
        maxlength: [1000, 'Report reason cannot exceed 1,000 characters']
    },
    decider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decision: { type: String, enum: ['Open', 'Approved', 'Rejected'], required: true, default: 'Open' },
    decidedAt: { type: Date, default: null },
}, { timestamps: true });

reportSchema.index( {reporter: 1, contentType: 1, contentId: 1 }, {unique: true });

module.exports = mongoose.model('Report', reportSchema);
