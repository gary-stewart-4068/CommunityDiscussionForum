
const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Topic title is required'], trim: true },
    content: { type: String, required: [true, 'Topic content is required'], trim: true },
    _visible: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Topic', topicSchema);
