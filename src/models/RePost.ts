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
    },
    likes: [{
        type: ObjectId,
        ref: 'User'
    }],
});

// Compose repost object properties for UI
export function getRepostData(post, value) {
    return {
        id: value.id,
        postId: post._id,
        userId: post.userId._id,
        userName: post.userId.name,
        userLogin: post.userId.login,
        avatar: post.userId.avatar,
        date: post.createdAt,
        edited: post.updatedAt,
        content: post.content,
        contentJson: post.contentJson,
        reposted: post.reposted,
        tags: post.tags,
        attachments: post.attachments,
        reposted_date: value.date,
        likes: value.likes
    }
}

export default mongoose.model('RePost', schema);
