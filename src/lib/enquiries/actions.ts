"use server";
import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { withSerializableRetry } from "@/lib/prisma/withSerializableRetry";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { dispatchEmailOutbox } from "@/lib/email/outbox";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function createQuotationFromEnquiryAction(id: string) {
  const { user } = await requirePermission("sales.write");
  const enquiryId = z.uuid().parse(id);
  const result = await withSerializableRetry(async tx => {
    const lock = `enquiry:${enquiryId}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, 0))`;
    const lead = await tx.websiteEnquiry.findUniqueOrThrow({ where: { id: enquiryId } });
    if (lead.quotationId) return { id: lead.quotationId };
    const quoteFy = getFinancialYearLabel(new Date());
    const counter = await tx.fiscalCounter.upsert({ where: { key: `EXQN-${quoteFy}` }, create: { key: `EXQN-${quoteFy}`, value: 1 }, update: { value: { increment: 1 } } });
    const header = { platform: "WEBSITE", clientName: lead.company || lead.name, receivedFromName: lead.name, receivedFromPhone: lead.phone, receivedFromEmail: lead.email, enquiryMessage: [lead.productInterest, lead.quantity, lead.message].filter(Boolean).join("\n"), gst: "CGST_SGST_18" };
    const quotation = await tx.quotation.create({ data: { quoteFy, quoteNo: counter.value, status: "DRAFT", ...header, platform: "WEBSITE", gst: "CGST_SGST_18", draftData: { header, items: [] }, draftVersion: 0, createdById: user.id, updatedById: user.id }, select: { id: true } });
    await tx.websiteEnquiry.update({ where: { id: enquiryId }, data: { quotationId: quotation.id, status: "QUOTED" } });
    return quotation;
  });
  revalidatePath("/dashboard/enquiries");
  return result;
}
export async function retryEnquiryNotificationAction(id: string) {
  await requirePermission("sales.write");
  const enquiryId = z.uuid().parse(id);
  const mail = await prisma.emailOutbox.findUnique({ where: { deduplicationKey: `enquiry:${enquiryId}` }, select: { id: true, status: true } });
  if (!mail || mail.status === "SENT") return { status: mail?.status ?? "MISSING" };
  await prisma.emailOutbox.updateMany({ where: { id: mail.id, status: { in: ["FAILED", "PENDING"] } }, data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date() } });
  await dispatchEmailOutbox(mail.id);
  revalidatePath("/dashboard/enquiries");
  const result = await prisma.emailOutbox.findUnique({ where: { id: mail.id }, select: { status: true } });
  return { status: result?.status ?? "MISSING" };
}
