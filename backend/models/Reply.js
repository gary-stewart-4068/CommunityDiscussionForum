
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    content: { type: String, required: [true, 'Reply content is required'], trim: true },
    _visible: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Reply', replySchema);
