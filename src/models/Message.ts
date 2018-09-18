import mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Message schema definition.
const schema = new Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    },
    content: {
        type: String,
        required: true
    }
});

export function formatMessageData(message) {
    const { _id, userId, content, date } = message;
    return {
        id: _id,
        userId,
        content,
        date
    }
}

export default mongoose.model('Message', schema);