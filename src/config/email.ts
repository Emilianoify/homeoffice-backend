import nodemailer from "nodemailer";
import logger from "../middlewares/logging";

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Sistema Home Office" <${process.env.SMTP_USER}>`,
      ...options,
    });

    logger.info(`Email enviado: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error("Error enviando email:", error);
    throw error;
  }
}

export default transporter;
