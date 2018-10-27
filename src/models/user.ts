import mongoose = require('mongoose');
import Wallet from './Wallet';
import Expirience from './Expirience';
import {Roles, getPermission} from '../auth/permissions';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// User schema definition.
const schema = new Schema({
    name: {
        type: String,
        required: true
    },
    login: {
        type: String,
        required: true,
        unique: true
    },
    pwd: {
        type: Buffer,  
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: [Roles.Guest, Roles.User, Roles.Admin],
        default: Roles.Guest
    },
    phone: String,
    photo: {
        type: ObjectId,
        ref: 'Image'
    },
    avatar:  {
        type: ObjectId,
        ref: 'Image'
    },
    country: String,
    city: String,
    site: String,
    jobs: [Expirience],
    educations: [Expirience],
    clinks: {
        fb: {
            type: String,
            default: ""
        },
        linkedin: {
            type: String,
            default: ""
        },
        instagram: {
            type: String,
            default: ""
        },
        twitter: {
            type: String,
            default: ""
        },
        telegram: {
            type: String,
            default: ""
        },
        wechat: {
            type: String,
            default: ""
        }
    },
    pined_post: {
        type: ObjectId,
        ref: 'Post'
    },
    posts: [{
        type: ObjectId,
        ref: 'Post'
    }],
    reposts: [{
        type: ObjectId,
        ref: 'RePost'
    }],
    pools: [{
        type: ObjectId,
        ref: 'Pool'
    }],
    wallets: [Wallet],
    chats:  [{
        type: ObjectId,
        ref: 'Chat'
    }],
    follows: [{
        type: ObjectId,
        ref: 'User'
    }],
    subscribers: [{
        type: ObjectId,
        ref: 'User'
    }],
    pmsenders: {
        type: String,
        enum: ['All','Verified','Follows','Nobody'],
        default: 'All'
    },
    commenters: {
        type: String,
        enum: ['All','Verified','Follows','Nobody'],
        default: 'All'
    },
    twoFactorAuth: {
        type: Boolean,
        default: false
    },
    notifications: {
        type: Boolean,
        default: false
    },
    top: {
        type: Boolean,
        default: false
    },
    verified:  {
        type: Boolean,
        default: false
    },
    about: String,
    language: {
        type: String,
        enum: ['en', 'ru', 'cn'],
        default: 'en'
    },
    confirmation: {
        type: String,
        enum: ['notConfirmed', 'sendedConfirmation', 'confirmed'],
        default: 'notConfirmed'
    }
}, { timestamps: true });

schema.set('toJSON', {
    virtuals: true
});

/**
 * Assign 'User' role to a given user.
 * @param user 
 */
export function setUserRole(user) {
    user.role = Roles.User;
}

// Compose user object properties for UI
export function getShortUserData(user) {
    return {
        id: user._id,
        name: user.name,
        login: user.login,
        avatar: user.avatar,
        country: user.country,
        top: user.top
    }
}
// Compose user object properties for UI
export function getUserData(user) {
    return {
        id: user._id,
        name: user.name,
        login: user.login,
        email: user.email,
        role: user.role,
        permissions: getPermission(user.role),
        phone: user.phone,
        photo: user.photo,
        avatar: user.avatar,
        country: user.country,
        city: user.city,
        site: user.site,
        clinks: user.clinks,
        educations: user.educations,
        jobs: user.jobs,
        wallets: user.wallets,
        pmsenders: user.pmsenders,
        commenters: user.commenters,
        twoFactorAuth: user.twoFactorAuth,
        notifications: user.notifications,
        pined_post: user.pined_post,
        top: user.top,
        verified: user.verified,
        about: user.about,
        language: user.language
    }
}
  
export default mongoose.model('User', schema);
