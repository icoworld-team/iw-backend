import mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Comment schema definition.
const schema = new Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: ObjectId,
        ref: 'Post',
        required: true
    },
    content: String,
}, { timestamps: true });

// Compose comment object properties for UI.
export function getCommentData(item) {
    return {
        Id: item._id,
        userId: item.userId._id,
        postId: item.postId._id,
        userName: item.userId.name,
        userLogin: item.userId.login,
        date: item.createdAt,
        edited: item.updatedAt,
        content: item.content,
    }
}

export default mongoose.model('Comment', schema);   