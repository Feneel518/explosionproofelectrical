"use server";

import { z } from "zod";
import transporter from "@/lib/email/nodemailer";
import { prisma } from "@/lib/prisma/db";
import {
  escapeEmailHtml,
  renderEmailInfoTable,
  renderThemedEmailLayout,
} from "@/lib/email/themeTemplate";

const SALES_EMAIL = "sales1.exec@gmail.com";

const newsletterSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  companyName: z.string().trim().min(2, "Company name is required"),
});

const enquirySchema = z.object({
  productName: z.string().trim().optional(),
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().min(7, "Phone is required"),
  companyName: z.string().trim().optional(),
  message: z.string().trim().min(5, "Message is required"),
});

export async function submitNewsletterLeadAction(input: {
  name: string;
  email: string;
  companyName: string;
}) {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Please fill all fields correctly.",
    };
  }

  const data = parsed.data;

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: data.email.toLowerCase() },
      create: {
        email: data.email.toLowerCase(),
        name: data.name,
        status: "SUBSCRIBED",
        source: "FOOTER_FORM",
      },
      update: {
        name: data.name,
        status: "SUBSCRIBED",
        source: "FOOTER_FORM",
        unsubscribedAt: null,
      },
    });

    const subject = `New Newsletter Subscriber - ${data.name}`;
    const html = renderThemedEmailLayout({
      title: "New Newsletter Subscription",
      preheader: `${data.name} subscribed from website`,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155;">
          A new website visitor subscribed to your newsletter.
        </p>
        ${renderEmailInfoTable([
          { label: "Name", value: data.name },
          { label: "Email", value: data.email },
          { label: "Company", value: data.companyName },
          {
            label: "Submitted At",
            value: new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(new Date()),
          },
        ])}
      `,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_USER,
      to: SALES_EMAIL,
      subject,
      html,
    });

    return {
      ok: true as const,
      message: "Thanks for subscribing. Our team will contact you soon.",
    };
  } catch (error) {
    console.error("submitNewsletterLeadAction", error);
    return {
      ok: false as const,
      message: "Could not submit newsletter right now. Please try again.",
    };
  }
}

export async function submitProductEnquiryAction(input: {
  productName?: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  message: string;
}) {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Please fill all fields correctly.",
    };
  }

  const data = parsed.data;

  try {
    const subject = data.productName?.trim()
      ? `Product Enquiry - ${data.productName.trim()}`
      : "New Product Enquiry";

    const safeMessage = escapeEmailHtml(data.message).replaceAll("\n", "<br/>");

    const html = renderThemedEmailLayout({
      title: "Website Product Enquiry",
      preheader: `${data.name} submitted a product enquiry`,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155;">
          A new enquiry has been submitted from the frontend website.
        </p>
        ${renderEmailInfoTable([
          { label: "Product", value: data.productName?.trim() || "General Enquiry" },
          { label: "Name", value: data.name },
          { label: "Email", value: data.email },
          { label: "Phone", value: data.phone },
          { label: "Company", value: data.companyName?.trim() || "N/A" },
          {
            label: "Submitted At",
            value: new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(new Date()),
          },
        ])}
        <div style="margin:0 0 8px;font-weight:600;color:#1f3d5b;">Message</div>
        <div style="padding:12px;border:1px solid #d7e0ea;border-radius:8px;background:#fbfdff;color:#12263a;font-size:14px;line-height:1.6;">
          ${safeMessage}
        </div>
      `,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_USER,
      to: SALES_EMAIL,
      replyTo: data.email,
      subject,
      html,
    });

    return {
      ok: true as const,
      message: "Enquiry sent successfully. Our sales team will contact you.",
    };
  } catch (error) {
    console.error("submitProductEnquiryAction", error);
    return {
      ok: false as const,
      message: "Could not send enquiry right now. Please try again.",
    };
  }
}
