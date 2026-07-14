"use server";

import { revalidatePath } from "next/cache";
import { ProductMediaKind } from "@prisma/client";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

type LrCopyInput = {
  kind: ProductMediaKind;
  url: string;
  title?: string | null;
};

export async function updateInvoiceLrCopyAction(
  invoiceId: string,
  files: LrCopyInput[],
) {
  await requireAuth();

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!invoice) {
      return { ok: false as const, message: "Invoice not found" };
    }

    if (invoice.status !== "FINALIZED") {
      return {
        ok: false as const,
        message: "LR copy can be updated only for finalized invoices",
      };
    }

    const nextFiles = (Array.isArray(files) ? files : [])
      .map((file) => {
        const url = typeof file?.url === "string" ? file.url.trim() : "";
        if (!url) return null;

        const title =
          typeof file?.title === "string" && file.title.trim().length > 0
            ? file.title.trim()
            : null;

        return {
          invoiceId: invoice.id,
          kind:
            file.kind === ProductMediaKind.DRAWING
              ? ProductMediaKind.DRAWING
              : ProductMediaKind.IMAGE,
          url,
          title,
        };
      })
      .filter(
        (
          file,
        ): file is {
          invoiceId: string;
          kind: ProductMediaKind;
          url: string;
          title: string | null;
        } => Boolean(file),
      );

    await prisma.$transaction(async (tx) => {
      await tx.productMedia.deleteMany({
        where: { invoiceId: invoice.id },
      });

      if (nextFiles.length > 0) {
        await tx.productMedia.createMany({
          data: nextFiles,
        });
      }
    });

    revalidatePath("/dashboard/sales/invoices");
    revalidatePath(`/dashboard/sales/invoices/${invoice.id}`);

    return {
      ok: true as const,
      message:
        nextFiles.length > 0 ? "LR copy updated successfully" : "LR copy removed",
    };
  } catch (error) {
    console.error("updateInvoiceLrCopyAction", error);
    return { ok: false as const, message: "Failed to update LR copy" };
  }
}
