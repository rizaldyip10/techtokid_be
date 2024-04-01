import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER_MAILER,
        pass: process.env.PASS_MAILER
    },
    tls: {
        rejectUnauthorized: false
    }
});

export default transporter