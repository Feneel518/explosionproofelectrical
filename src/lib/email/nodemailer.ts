import { config as loadDotenv } from "dotenv";
import nodemailer, { type SendMailOptions } from "nodemailer";

loadDotenv();

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  const missingVars: string[] = [];
  if (!user) missingVars.push("SMTP_USER (or EMAIL_USER)");
  if (!pass) missingVars.push("SMTP_PASS (or EMAIL_PASS)");

  if (missingVars.length) {
    throw new Error(
      `Missing SMTP configuration: ${missingVars.join(", ")}. Set these in runtime environment variables and restart the server.`,
    );
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
  };
}

const transporter = {
  async sendMail(mailOptions: SendMailOptions) {
    const smtpConfig = getSmtpConfig();
    const runtimeTransporter = nodemailer.createTransport(smtpConfig);
    return runtimeTransporter.sendMail(mailOptions);
  },
};

export default transporter;
