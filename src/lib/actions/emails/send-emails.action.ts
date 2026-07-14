"use server";

import transporter from "@/lib/email/nodemailer";
import {
  escapeEmailHtml,
  renderThemedEmailLayout,
} from "@/lib/email/themeTemplate";

export const sendEmail = async (
  to: string,
  subject: string,
  meta: {
    description: string;
    link: string;
  },
) => {
  const safeDescription = escapeEmailHtml(meta.description);
  const safeLink = escapeEmailHtml(meta.link);

  const html = renderThemedEmailLayout({
    title: subject,
    preheader: meta.description,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#334155;">${safeDescription}</p>
      <div style="margin:0 0 18px;">
        <a href="${safeLink}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#0f4c81;color:#ffffff;font-weight:600;text-decoration:none;">Open Secure Link</a>
      </div>
      <p style="margin:0;font-size:13px;color:#64748b;">If the button does not work, copy and open this URL in your browser:<br/><span style="word-break:break-all;color:#1d4c72;">${safeLink}</span></p>
    `,
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
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
