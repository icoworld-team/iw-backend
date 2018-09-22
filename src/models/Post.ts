import mongoose = require('mongoose');
import { Image } from './Image';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Post schema definition.
const schema = new Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    content: String,
    reposted: {
        type: Number,
        default: 0
    },
    comments: [{
        type: ObjectId,
        ref: 'Comment'
    }],
    likes: [{
        type: ObjectId,
        ref: 'User'
    }],
    tags: [String],
    attachments: [Image]
}, { timestamps: true });

// Compose post object properties for UI
export function getPostData(post) {
    return {
        postId: post._id,
        userId: post.userId._id,
        userName: post.userId.name,
        userLogin: post.userId.login,
        date: post.createdAt,
        edited: post.updatedAt,
        content: post.content,
        reposted: post.reposted,
        comments: post.comments,
        likes: post.likes,
        tags: post.tags,
        attachments: post.attachments
    }
}

// Compose post object properties needed for response on edit post request
export function getPostDataForEditResponse(post) {
    return {
        postId: post._id,
        userId: post.userId._id,
        date: post.createdAt,
        edited: post.updatedAt,
        content: post.content,
        reposted: post.reposted,
        comments: post.comments,
        likes: post.likes,
        tags: post.tags,
        attachments: post.attachments
    }
}

export default mongoose.model('Post', schema);   