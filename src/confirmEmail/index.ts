import * as nodemailer from 'nodemailer';
import { encrypt } from './helpers';
require('dotenv').config();

const HOST = 'smtp.gmail.com';
const BASE_URL = process.env.BASE_URL; // 'http://icoworld.projects.oktend.com:3000'
const SECRET = process.env.EMAIL_SECRET; // 'secret'
const SENDER_EMAIL = process.env.SENDER_EMAIL_ADDRESS; // 'icoworldcloud@gmail.com'
const SENDERPASS = process.env.SENDER_EMAIL_PASS; // '123456@@'

console.log('environment variables')
console.log('BASE_URL', BASE_URL);
console.log('SECRET', SECRET);
console.log('SENDER_EMAIL', SENDER_EMAIL);
console.log('SENDERPASS', SENDERPASS);

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: HOST,
  // port: 465,
  // secure: true,
  auth: {
    user: SENDER_EMAIL,
    pass: SENDERPASS
  }
});

export function generateConfirmationUrl(userId, secret = SECRET) {
  const hash = encrypt(secret, userId);
  const confirmEmailUrl = `${BASE_URL}/confirmEmail/${hash}`;
  return confirmEmailUrl;
}

export function generateEmailBody(confirmEmailUrl) {
  const emailBody = 
    `<h1>Welcome to icoWorld!</h1>
    <span>Please confirm your email address:</span>
    <a href="${confirmEmailUrl}">${confirmEmailUrl}</a>`;
  return emailBody;
}

function generateMailOptions(recipientAddress, html) {
  return {
   from: SENDER_EMAIL, // sender address
   to: recipientAddress, // list of receivers
   subject: 'Welcome! Confirm your email!', // Subject line
   // text: emailMessage, // plain text body
   html // html body
 };
}

export async function sendMail(recipientAddress, emailBody) {
  const mailOptions = generateMailOptions(recipientAddress, emailBody);
  const result = await transporter.sendMail(mailOptions);
  return result;
}
