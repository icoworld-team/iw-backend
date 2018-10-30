import * as nodemailer from 'nodemailer';

// Common email server parameters.
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const IW_EMAIL = process.env.IW_EMAIL_ADDRESS || 'icoworldcloud@gmail.com';
const IW_PASS = process.env.IW_EMAIL_PASS || '123456@@';

// Reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    // port: 465,
    // secure: true,
    auth: {
        user: IW_EMAIL,
        pass: IW_PASS
    }
});

export async function sendHtmlEMail(address, subject, body) {
    const result = await transporter.sendMail({
        from: IW_EMAIL,       // sender address
        to: address, // list of receivers
        subject,              // Subject line
        html: body            // html body
    });
    return result;
}

export async function sendTextEMail(address, subject, body) {
    const result = await transporter.sendMail({
        from: IW_EMAIL,       // sender address
        to: address, // list of receivers
        subject,              // Subject line
        text: body            // text body
    });
    return result;
}