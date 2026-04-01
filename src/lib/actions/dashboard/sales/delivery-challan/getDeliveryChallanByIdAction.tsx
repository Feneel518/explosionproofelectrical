"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export const getDeliveryChallanByIdAction = async (id: string) => {
  await requireAuth();

  const deliveryChallan = await prisma.deliveryChallan.findUnique({
    where: { id },
    select: {
      id: true,
      challanNo: true,
      challanFy: true,
      challanCode: true,

      status: true,
      type: true,
      partyType: true,

      date: true,
      issuedAt: true,
      closedAt: true,
      cancelledAt: true,

      expectedReturnDate: true,
      expectedClosureDate: true,

      poNumber: true,

      quotationId: true,
      quotation: {
        select: {
          id: true,
          quoteNo: true,
          quoteFy: true,
          clientName: true,
        },
      },

      customerId: true,
      customer: {
        select: {
          id: true,
          companyName: true,
          gstin: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },

      transporterName: true,
      vehicleNumber: true,
      driverName: true,
      driverPhone: true,
      dispatchThrough: true,
      lrNumber: true,
      numberOfPackages: true,
      remarks: true,
      closureRemarks: true,

      createdAt: true,
      updatedAt: true,

      items: {
        select: {
          id: true,
          kind: true,
          productVariantId: true,
          title: true,
          sku: true,
          typeNumber: true,
          description: true,
          hsnCode: true,
          unit: true,
          qty: true,
          closedQty: true,
          pendingQty: true,
          sortOrder: true,
          productVariant: {
            select: {
              id: true,
              variant: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!deliveryChallan) {
    return {
      ok: false as const,
      message: "Delivery challan not found",
    };
  }

  return {
    ok: true as const,
    deliveryChallan,
  };
};
