"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma/db";
import { acceptWebsiteEnquiry } from "@/lib/enquiries/accept";
import { consumeSubmissionLimit, SubmissionLimitError } from "@/lib/security/submissionLimit";
import { dispatchEmailOutbox } from "@/lib/email/outbox";
import { renderEmailInfoTable, renderThemedEmailLayout } from "@/lib/email/themeTemplate";

const newsletterSchema = z.object({ name: z.string().trim().min(2).max(160), email: z.email().trim().toLowerCase().max(254), companyName: z.string().trim().min(2).max(200) });
const enquirySchema = z.object({ productName: z.string().trim().max(160).optional(), name: z.string().trim().min(2).max(160), email: z.email().trim().toLowerCase().max(254), phone: z.string().trim().min(7).max(40), companyName: z.string().trim().max(200).optional(), message: z.string().trim().min(5).max(10000) });

export async function submitNewsletterLeadAction(input: { name: string; email: string; companyName: string }) {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Please enter a name, valid email and company name." };
  const data = parsed.data;
  try {
    const requestHeaders = await headers();
    await consumeSubmissionLimit("newsletter-ip", requestHeaders.get("x-vercel-forwarded-for") || requestHeaders.get("x-real-ip") || requestHeaders.get("x-forwarded-for")?.split(",")[0] || "unknown", 10, 3600);
    await consumeSubmissionLimit("newsletter-email", data.email, 3, 3600);
    const mail = await prisma.$transaction(async tx => {
      await tx.newsletterSubscriber.upsert({ where: { email: data.email }, create: { email: data.email, name: data.name, source: "FOOTER_FORM" }, update: { name: data.name, status: "SUBSCRIBED", source: "FOOTER_FORM", unsubscribedAt: null } });
      return tx.emailOutbox.upsert({ where: { deduplicationKey: `newsletter:${data.email}:${new Date().toISOString().slice(0, 10)}` }, update: {}, create: {
        deduplicationKey: `newsletter:${data.email}:${new Date().toISOString().slice(0, 10)}`, recipient: process.env.SALES_NOTIFICATION_EMAIL || "sales1.exec@gmail.com", replyTo: data.email,
        subject: "New website subscriber", html: renderThemedEmailLayout({ title: "New website subscriber", bodyHtml: renderEmailInfoTable([{ label: "Name", value: data.name }, { label: "Email", value: data.email }, { label: "Company", value: data.companyName }]) }),
      } });
    });
    await dispatchEmailOutbox(mail.id).catch(() => undefined);
    return { ok: true as const, message: "Thanks for subscribing. Your details have been saved." };
  } catch (error) { return { ok: false as const, message: error instanceof SubmissionLimitError ? error.message : "Could not save your subscription. Please try again shortly." }; }
}
export async function submitProductEnquiryAction(input: { productName?: string; name: string; email: string; phone: string; companyName?: string; message: string }) {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Please check your name, email, phone and message." };
  const data = parsed.data;
  try {
    await acceptWebsiteEnquiry({ name: data.name, email: data.email, phone: data.phone, company: data.companyName, productInterest: data.productName || "General enquiry", message: data.message, source: "PRODUCT_FORM" });
    return { ok: true as const, message: "Enquiry saved successfully. Our sales team will contact you." };
  } catch (error) { return { ok: false as const, message: error instanceof SubmissionLimitError ? error.message : "Could not save your enquiry. Please try again shortly." }; }
}
