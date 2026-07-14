"use server";

import transporter from "@/lib/email/nodemailer";
import { getFinancialYearLabel } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import {
  QuoteInquirySchema,
  type QuoteInquiryRequest,
} from "@/lib/validators/marketing/QuoteInquiryValidator";
import { revalidatePath } from "next/cache";

type QuoteInquiryActionResult =
  | {
      ok: true;
      message: string;
      quotationId: string;
      emailWarning?: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<keyof QuoteInquiryRequest, string[]>>;
    };

const INQUIRY_RECIPIENT = "info@explosionproofelectrical.com";

function optionalValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildEnquiryMessage(data: QuoteInquiryRequest) {
  return [
    `Product Interest: ${data.productInterest}`,
    data.quantity ? `Quantity: ${data.quantity}` : null,
    "",
    data.requirement.trim(),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function detailRow(label: string, value: string | null | undefined) {
  return `<tr>
    <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;background:#f9fafb;">${label}</td>
    <td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(value || "-")}</td>
  </tr>`;
}

export async function submitQuoteInquiryAction(
  values: QuoteInquiryRequest,
): Promise<QuoteInquiryActionResult> {
  const parsed = QuoteInquirySchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const fy = getFinancialYearLabel(new Date());
  const enquiryMessage = buildEnquiryMessage(data);

  try {
    const quotation = await prisma.$transaction(async (tx) => {
      const counter = await tx.fiscalCounter.upsert({
        where: {
          key: `EXQN-${fy}`,
        },
        create: {
          key: `EXQN-${fy}`,
          value: 1,
        },
        update: {
          value: {
            increment: 1,
          },
        },
      });

      return tx.quotation.create({
        data: {
          quoteFy: fy,
          quoteNo: counter.value,
          status: "DRAFT",
          platform: "WEBSITE",
          clientName: optionalValue(data.company) || data.fullName.trim(),
          receivedFromName: data.fullName.trim(),
          receivedFromPhone: optionalValue(data.phone),
          receivedFromEmail: data.email.trim(),
          enquiryMessage,
          gst: "CGST_SGST_18",
          draftData: {
            header: {
              platform: "WEBSITE",
              clientName: optionalValue(data.company) || data.fullName.trim(),
              receivedFromName: data.fullName.trim(),
              receivedFromPhone: optionalValue(data.phone),
              receivedFromEmail: data.email.trim(),
              enquiryMessage,
              gst: "CGST_SGST_18",
            },
            items: [],
          },
          draftVersion: 0,
        },
        select: {
          id: true,
          quoteFy: true,
          quoteNo: true,
        },
      });
    });

    const emailSubject = `Website quote inquiry - ${data.fullName.trim()}`;
    const quoteRef = `${quotation.quoteFy}-${String(quotation.quoteNo).padStart(3, "0")}`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#111827;">
      <h2 style="margin:0 0 12px;color:#0f172a;">New Website Quote Inquiry</h2>
      <p style="margin:0 0 18px;color:#4b5563;">A new website inquiry was saved as quotation ${quoteRef}.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${detailRow("Full Name", data.fullName)}
        ${detailRow("Company", data.company)}
        ${detailRow("Email", data.email)}
        ${detailRow("Phone", data.phone)}
        ${detailRow("Product Interest", data.productInterest)}
        ${detailRow("Quantity", data.quantity)}
      </table>
      <h3 style="margin:22px 0 8px;color:#0f172a;">Requirement</h3>
      <div style="white-space:pre-wrap;padding:14px;border:1px solid #e5e7eb;background:#f9fafb;line-height:1.55;">${escapeHtml(data.requirement.trim())}</div>
    </div>`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: INQUIRY_RECIPIENT,
        replyTo: data.email,
        subject: emailSubject,
        html,
      });
    } catch (error) {
      revalidatePath("/dashboard/sales/quotations");
      return {
        ok: true,
        message: "Request saved. Our team can follow up from the dashboard.",
        quotationId: quotation.id,
        emailWarning:
          error instanceof Error
            ? `Email could not be sent: ${error.message}`
            : "Email could not be sent.",
      };
    }

    revalidatePath("/dashboard/sales/quotations");
    return {
      ok: true,
      message: "Request received. Our engineering team will get back to you within one business day.",
      quotationId: quotation.id,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to send your request right now.",
    };
  }
}
