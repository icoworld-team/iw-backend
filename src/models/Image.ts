import mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Image schema definition.
const schema = new Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    format: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    }
}, {timestamps: true});

export default mongoose.model('Image', schema);