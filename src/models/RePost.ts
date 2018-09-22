import mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Repost schema definition.
const schema = new Schema({
    userId: {
        type: ObjectId,
        ref: 'User'
    },
    postId: {
        type: ObjectId,
        ref: 'Post'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Compose repost object properties for UI
export function getRepostData(post, rdate) {
    return {
        postId: post._id,
        userId: post.userId._id,
        userName: post.userId.name,
        userLogin: post.userId.login,
        date: post.createdAt,
        edited: post.updatedAt,
        content: post.content,
        tags: post.tags,
        reposted: rdate
    }
}

export default mongoose.model('RePost', schema);
