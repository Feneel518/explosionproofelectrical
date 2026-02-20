"use server";

import transporter from "@/lib/email/nodemailer";
import { link } from "fs";
import { tr } from "zod/v4/locales";

const styles = {
  container:
    "max-width:500px;margin:20px auto;padding:20px;border:1px solid #DDD;border-radius:px",
  header: "font-size:24px;font-weight:bold;margin-bottom:10px;color:#333",
  paragraph: "font-size:16px;margin-bottom:20px;color:#555",
  link: "display:inline-block;padding:10px 15px;background-color:#007BFF;color:#FFF;text-decoration:none;border-radius:5px;margin-top:15px",
};

export const sendEmail = async (
  to: string,
  subject: string,
  meta: {
    description: string;
    link: string;
  },
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `${subject}`,
    html: `<div style="${styles.container}">
        <div style="${styles.header}">${subject}</div>
        <div style="${styles.paragraph}">${meta.description}</div>
        <a href="${meta.link}" style="${styles.link}">Click Here</a>
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
