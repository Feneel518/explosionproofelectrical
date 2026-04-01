"use server";

import { revalidatePath } from "next/cache";
import transporter from "@/lib/email/nodemailer";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import {
  getPaymentDueDateFromTerms,
  getPaymentTermsLabel,
} from "@/lib/helpers/globalHelpers/invoicePaymentReminder";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import {
  escapeEmailHtml,
  renderEmailInfoTable,
  renderThemedEmailLayout,
} from "@/lib/email/themeTemplate";

function formatDate(value?: Date | null) {
  if (!value) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  } catch {
    return "N/A";
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export async function sendInvoicePaymentReminderEmailAction(invoiceId: string) {
  await requireAuth();

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceNo: true,
        invoiceFy: true,
        status: true,
        invoiceDate: true,
        dispatchDate: true,
        poNumber: true,
        poDate: true,
        grandTotal: true,
        clientNameSnapshot: true,
        paymentReceived: true,
        salesOrder: {
          select: {
            paymentTerms: true,
            receivedFromName: true,
            receivedFromEmail: true,
            customer: {
              select: {
                companyName: true,
                companyEmail: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return { ok: false as const, message: "Invoice not found" };
    }

    if (invoice.status !== "FINALIZED") {
      return {
        ok: false as const,
        message: "Only finalized invoices can be reminded",
      };
    }

    if (invoice.paymentReceived) {
      return {
        ok: false as const,
        message: "Payment already marked as received",
      };
    }

    const recipientEmail =
      invoice.salesOrder.customer?.companyEmail?.trim() ||
      invoice.salesOrder.receivedFromEmail?.trim() ||
      "";

    if (!recipientEmail) {
      return {
        ok: false as const,
        message: "Customer email not available on this invoice/order",
      };
    }

    const invoiceNumber = formatFinancialDocumentNumber(
      invoice.invoiceFy,
      invoice.invoiceNo,
    );

    const paymentTerms = invoice.salesOrder.paymentTerms;
    const paymentTermsLabel = getPaymentTermsLabel(paymentTerms);

    const dueDate = getPaymentDueDateFromTerms({
      paymentTerms,
      invoiceDate: invoice.invoiceDate,
      dispatchDate: invoice.dispatchDate,
    });

    const subject = `Payment Reminder - Invoice ${invoiceNumber}`;
    const customerName =
      invoice.clientNameSnapshot ||
      invoice.salesOrder.customer?.companyName ||
      "Customer";
    const contactPerson = invoice.salesOrder.receivedFromName || customerName;

    const html = renderThemedEmailLayout({
      title: "Payment Reminder",
      preheader: `Pending payment for invoice ${invoiceNumber}`,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155;">Dear ${escapeEmailHtml(contactPerson)},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155;">
          This is a gentle reminder for pending payment against the invoice below.
        </p>
        ${renderEmailInfoTable([
          { label: "Invoice Number", value: invoiceNumber },
          { label: "Invoice Date", value: formatDate(invoice.invoiceDate) },
          { label: "PO Number", value: invoice.poNumber || "N/A" },
          { label: "PO Date", value: formatDate(invoice.poDate) },
          { label: "Payment Terms", value: paymentTermsLabel },
          { label: "Due Date", value: formatDate(dueDate) },
          {
            label: "Pending Amount",
            value: formatCurrency(Number(invoice.grandTotal ?? 0)),
          },
        ])}
        <p style="margin:0;font-size:15px;line-height:1.65;color:#334155;">
          Kindly process the payment and share payment confirmation details.
        </p>
      `,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipientEmail,
      subject,
      html,
    });

    const now = new Date();
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        emailedAt: now,
        emailedTo: recipientEmail,
        emailSubject: subject,
        paymentReminderLastSentAt: now,
        paymentReminderCount: { increment: 1 },
      },
    });

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${invoice.id}`);

    return {
      ok: true as const,
      message: `Reminder email sent to ${recipientEmail}`,
    };
  } catch (error) {
    console.error("sendInvoicePaymentReminderEmailAction", error);
    return {
      ok: false as const,
      message: "Failed to send payment reminder email",
    };
  }
}
