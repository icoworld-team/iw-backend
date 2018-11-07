import * as crypto from 'crypto';
import User from "../models/user";
import { sendHtmlEMail } from '../util/email';

const BASE_URL = process.env.BASE_URL || 'http://icoworld.projects.oktend.com:3000';
const CONFIRM_KEY = process.env.EMAIL_CONFIRM_KEY || 'dqwe811gj12h1g26';

const title = 'Email address confirmation for icoWorld!';
const alg = 'aes-256-cbc';

// Confirmation statuses definition.
export const Status = {
    NotConfirmed: 'notConfirmed',
    AwaitsConfirmation: 'awaitsConfirmation',
    Confirmed: 'confirmed',
}

function encrypt(data, key = CONFIRM_KEY) {
    const cipher = crypto.createCipher(alg, key);
    let crypted = cipher.update(data, 'utf-8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

export function decrypt(data, key = CONFIRM_KEY) {
    const decipher = crypto.createDecipher(alg, key);
    let decrypted = decipher.update(data, 'hex', 'utf-8' as any);
    decrypted += decipher.final('utf-8');
    return decrypted;
}

/**
 * Send email to given user.
 * @param user 
 */
export async function sendMail(user) {
    const hash = encrypt(user._id.toString());
    const url = `${BASE_URL}/confirmEmail/${hash}`;
    const body =
        `<h1>Welcome to icoWorld!</h1>
      <span>Please confirm your email address:</span>
      <a href="${url}">${url}</a>`;

    const result = await sendHtmlEMail(user.email, title, body);
    return result;
}

/**
 * Send email by updating user's email
 * @param user 
 */
export async function sendMailOnUpdatedEmail(user) {
    const hash = encrypt(user._id.toString());
    const url = `${BASE_URL}/confirmEmail/${hash}`;
    const body =
        `<h1>You have changed your email!</h1>
      <span>Please confirm your new email address:</span>
      <a href="${url}">${url}</a>`;

    const result = await sendHtmlEMail(user.email, title, body);
    return result;
}

/**
 * Set 'awaits confirmation' status for given userId.
 * @param userId 
 */
export async function setAwaitsConfirmation(userId) {
    await User.findByIdAndUpdate(userId, { confirmation: Status.AwaitsConfirmation });
}

/**
 * Set 'confirmed' status for a given userId.
 * @param userId 
 */
export async function setConfirmed(userId) {
    await User.findByIdAndUpdate(userId, { confirmation: Status.Confirmed });
}