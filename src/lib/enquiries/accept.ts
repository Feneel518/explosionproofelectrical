import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/db";
import { consumeSubmissionLimit } from "@/lib/security/submissionLimit";
import { escapeEmailHtml, renderEmailInfoTable, renderThemedEmailLayout } from "@/lib/email/themeTemplate";
import { dispatchEmailOutbox } from "@/lib/email/outbox";

export type EnquiryInput = { name: string; email: string; phone?: string; company?: string; productInterest: string; quantity?: string; message: string; source: "QUOTE_FORM" | "PRODUCT_FORM" };
export async function acceptWebsiteEnquiry(data: EnquiryInput) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-vercel-forwarded-for") || requestHeaders.get("x-real-ip") || requestHeaders.get("x-forwarded-for")?.split(",")[0] || "unknown";
  await consumeSubmissionLimit("enquiry-ip", ip, 20, 3600);
  await consumeSubmissionLimit("enquiry-email", data.email, 5, 3600);
  const deduplicationKey = createHash("sha256").update(JSON.stringify({ ...data, email: data.email.toLowerCase(), day: new Date().toISOString().slice(0, 10) })).digest("hex");
  const result = await prisma.$transaction(async tx => {
    const lead = await tx.websiteEnquiry.upsert({ where: { deduplicationKey }, update: {}, create: { ...data, email: data.email.toLowerCase(), deduplicationKey } });
    const html = renderThemedEmailLayout({ title: "Website enquiry", preheader: `${data.name} requested product information`, bodyHtml:
      renderEmailInfoTable([{ label: "Name", value: data.name }, { label: "Email", value: data.email }, { label: "Company", value: data.company || "—" }, { label: "Phone", value: data.phone || "—" }, { label: "Product", value: data.productInterest }, { label: "Quantity", value: data.quantity || "—" }])
      + `<p style="white-space:pre-wrap">${escapeEmailHtml(data.message)}</p>` });
    const mail = await tx.emailOutbox.upsert({ where: { deduplicationKey: `enquiry:${lead.id}` }, update: {}, create: {
      deduplicationKey: `enquiry:${lead.id}`, recipient: process.env.SALES_NOTIFICATION_EMAIL || "info@explosionproofelectrical.com", replyTo: data.email,
      subject: `Website enquiry — ${data.productInterest.slice(0, 120)}`, html,
    } });
    return { id: lead.id, mailId: mail.id };
  });
  // The enquiry and notification are already durable, even when SMTP is unavailable.
  await dispatchEmailOutbox(result.mailId).catch(() => undefined);
  return { enquiryId: result.id };
}
