"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function getQuotationByIdAction(id: string) {
  await requireAuth();

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          companyPhone: true,
          companyEmail: true,
          city: true,
          state: true,
          gstin: true,
          addressLine1: true,
          addressLine2: true,
          pincode: true,
        },
      },
      items: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              flpType: true,
              protection: true,
              gasGroup: true,
              material: true,
              finish: true,
              hsnCode: true,
              hardware: true,
              zones: true,
            },
          },
          variant: {
            select: {
              id: true,
              variant: true,
              sku: true,
              typeNumber: true,
              rating: true,
              size: true,
              rpm: true,
              kW: true,
              horsePower: true,
              cutoutSize:true,
              plateSize:true,
              glass:true,
              wireGuard:true,
              terminals:true,
              gasket:true,
              mounting:true,
              cableEntry:true,
              earthing:true,
              images:{
                select:{
                  url:true
                }
              },

              components: {
                select: {
                  component: {
                    select: {
                      item: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
          ComponentsOfProductInQuotation: {
            include: {
              componentsOfQuotation: {
                select: {
                  id: true,
                  item: true,
                  unit: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
      followups: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          scheduledAt: "desc",
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!quotation) {
    return { ok: false as const, message: "Quotation not found" };
  }

  const items = quotation.items.map((item) => {
    const unitPrice = item.unitPrice.toString();
    const lineTotal = Number(item.qty || 0) * Number(unitPrice || 0);

    return {
      ...item,
      unitPrice,
      lineTotal,
      component: item.ComponentsOfProductInQuotation.map((join) => ({
        id: join.componentsOfQuotation.id,
        item: join.componentsOfQuotation.item,
        unit: join.componentsOfQuotation.unit,
      })),
    };
  });

  const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);

  return {
    ok: true as const,
    quotation: {
      ...quotation,
      items,
      subtotal,
    },
  };
}
