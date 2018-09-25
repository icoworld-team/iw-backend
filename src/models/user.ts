import mongoose = require('mongoose');
import {Image} from './Image';
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
    login: String,
    pwd: {
        type: Buffer,  
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: {
            unique: true,
            sparse: true
        }
    },
    role: {
        type: String,
        enum: [Roles.Guest, Roles.User, Roles.Admin],
        default: Roles.Guest
    },
    phone: String,
    photo: Image,
    avatar: Image,
    country: String,
    city: String,
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
    pmsenders: [{
        type: ObjectId,
        ref: 'User'
    }],
    commenters: [{
        type: ObjectId,
        ref: 'User'
    }],
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
    language: {
        type: String,
        enum: ['en', 'ru', 'cn'],
        default: 'en'
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
        clinks: user.clinks,
        educations: user.educations,
        jobs: user.jobs,
        wallets: user.wallets,
        twoFactorAuth: user.twoFactorAuth,
        notifications: user.notifications,
        top: user.top,
        language: user.language
    }
}
  
export default mongoose.model('User', schema);
