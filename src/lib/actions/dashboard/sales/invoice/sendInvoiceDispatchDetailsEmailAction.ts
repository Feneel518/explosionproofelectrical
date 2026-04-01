"use server";

import { revalidatePath } from "next/cache";
import transporter from "@/lib/email/nodemailer";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);
  } catch {
    return "N/A";
  }
}

function normalizeToEmailList(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendInvoiceDispatchDetailsEmailAction(
  invoiceId: string,
  recipient: string,
) {
  await requireAuth();

  try {
    const recipients = normalizeToEmailList(recipient);

    if (!recipients.length) {
      return { ok: false as const, message: "Recipient email is required" };
    }

    const invalidEmail = recipients.find((email) => !isLikelyEmail(email));
    if (invalidEmail) {
      return {
        ok: false as const,
        message: `Invalid email: ${invalidEmail}`,
      };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
        invoiceNo: true,
        invoiceFy: true,
        invoiceDate: true,
        dispatchDate: true,
        poNumber: true,
        lrNumber: true,
        transporterName: true,
        vehicleNumber: true,
        driverName: true,
        driverPhone: true,
        dispatchThrough: true,
        ewayBill: true,
        remarks: true,
        clientNameSnapshot: true,
        lrCopy: {
          select: {
            id: true,
            url: true,
            title: true,
          },
        },
        packages: {
          select: {
            id: true,
          },
        },
        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            qty: true,
            unit: true,
          },
        },
        salesOrder: {
          select: {
            orderNo: true,
            orderFy: true,
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
        message: "Dispatch details can only be sent for finalized invoices",
      };
    }

    const invoiceNumber = formatFinancialDocumentNumber(
      invoice.invoiceFy,
      invoice.invoiceNo,
    );
    const salesOrderNumber = formatFinancialDocumentNumber(
      invoice.salesOrder.orderFy,
      invoice.salesOrder.orderNo,
    );

    const clientName =
      invoice.clientNameSnapshot ||
      invoice.salesOrder.customer?.companyName ||
      "Customer";
    const contactName =
      invoice.salesOrder.receivedFromName?.trim() || clientName;

    const packageCount = Number(invoice.packages?.length ?? 0);
    const itemsRows = invoice.items
      .map((item) => {
        const qty = Number(item.qty ?? 0);
        const unit = item.unit || "";
        return `<tr>
          <td style="padding:8px;border:1px solid #d7e0ea;color:#12263a;">${escapeEmailHtml(item.title || "Item")}</td>
          <td style="padding:8px;border:1px solid #d7e0ea;color:#12263a;text-align:right;">${escapeEmailHtml(`${qty} ${unit}`.trim())}</td>
        </tr>`;
      })
      .join("");

    const lrCopyRows = Array.isArray(invoice.lrCopy) ? invoice.lrCopy : [];
    const lrCopyHtml = lrCopyRows.length
      ? `<div style="margin:0 0 16px;">
          <div style="margin:0 0 8px;font-weight:600;color:#1f3d5b;">LR Copy</div>
          ${lrCopyRows
            .map(
              (file, index) => `
              <div style="margin:0 0 6px;">
                <a href="${escapeEmailHtml(file.url)}" style="color:#0f4c81;text-decoration:underline;">
                  ${escapeEmailHtml(file.title || `LR Copy ${index + 1}`)}
                </a>
              </div>
            `,
            )
            .join("")}
        </div>`
      : `<div style="margin:0 0 16px;font-size:14px;color:#64748b;">LR Copy: Not attached</div>`;

    const subject = `Dispatch Details - Invoice ${invoiceNumber}`;

    const html = renderThemedEmailLayout({
      title: "Dispatch Details",
      preheader: `Dispatch update for invoice ${invoiceNumber}`,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155;">Dear ${escapeEmailHtml(contactName)},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155;">
          Please find dispatch details for your invoice.
        </p>
        ${renderEmailInfoTable([
          { label: "Invoice Number", value: invoiceNumber },
          { label: "Invoice Date", value: formatDate(invoice.invoiceDate) },
          { label: "Sales Order", value: salesOrderNumber },
          { label: "PO Number", value: invoice.poNumber || "N/A" },
          { label: "Dispatch Date", value: formatDate(invoice.dispatchDate) },
          { label: "Transporter", value: invoice.transporterName || "N/A" },
          { label: "Dispatch Through", value: invoice.dispatchThrough || "N/A" },
          { label: "Vehicle Number", value: invoice.vehicleNumber || "N/A" },
          { label: "Driver Name", value: invoice.driverName || "N/A" },
          { label: "Driver Phone", value: invoice.driverPhone || "N/A" },
          { label: "LR Number", value: invoice.lrNumber || "N/A" },
          { label: "E-Way Bill", value: invoice.ewayBill || "N/A" },
          { label: "Total Packages", value: String(packageCount) },
        ])}

        ${lrCopyHtml}

        <div style="margin:0 0 8px;font-weight:600;color:#1f3d5b;">Dispatched Items</div>
        <table style="width:100%;border-collapse:collapse;margin:0 0 14px;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #d7e0ea;background:#f5f8fb;color:#1a3c5a;text-align:left;">Item</th>
              <th style="padding:8px;border:1px solid #d7e0ea;background:#f5f8fb;color:#1a3c5a;text-align:right;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || `<tr><td colspan="2" style="padding:8px;border:1px solid #d7e0ea;color:#64748b;">N/A</td></tr>`}
          </tbody>
        </table>

        ${
          invoice.remarks
            ? `<p style="margin:0;font-size:14px;color:#334155;"><strong>Remarks:</strong> ${escapeEmailHtml(invoice.remarks)}</p>`
            : ""
        }
      `,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipients.join(", "),
      subject,
      html,
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        emailedAt: new Date(),
        emailedTo: recipients.join(", "),
        emailSubject: subject,
      },
    });

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${invoice.id}`);

    return {
      ok: true as const,
      message: `Dispatch details sent to ${recipients.join(", ")}`,
    };
  } catch (error) {
    console.error("sendInvoiceDispatchDetailsEmailAction", error);
    return {
      ok: false as const,
      message: "Failed to send dispatch details email",
    };
  }
}
