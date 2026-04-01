// export type QuotationCustomer = {
//   id: string;
//   companyName: string;
//   companyPhone: string | null;
//   companyEmail: string | null;
//   city: string | null;
//   state: string | null;
//   gstin: string | null;
// };

// export type QuotationUser = {
//   id: string;
//   name: string | null;
//   email: string;
// };

// export type QuotationItemComponent = {
//   id: string;
//   item: string;
//   unit: string | null;
// };

// export type QuotationProduct = {
//   id: string;
//   name: string;
//   slug: string;
// };

// export type QuotationVariant = {
//   id: string;
//   variant: string;
//   sku: string | null;
//   typeNumber: string | null;
// };

// export type QuotationItem = {
//   id: string;
//   quotationId: string;
//   productId: string | null;
//   variantId: string | null;
//   qty: number;
//   unitPrice: string;
//   sortOrder: number;
//   createdAt: Date;
//   updatedAt: Date;

//   product: QuotationProduct | null;
//   variant: QuotationVariant | null;

//   ComponentsOfProductInQuotation: {
//     id: string;
//     createdAt: Date;
//     updatedAt: Date;
//     componentsOfQuotationId: string;
//     productInQuotationId: string;
//     componentsOfQuotation: {
//       id: string;
//       item: string;
//       unit: string | null;
//     };
//   }[];

//   component: QuotationItemComponent[];
//   lineTotal: number;
// };

// export type QuotationFollowup = {
//   id: string;
//   quotationId: string;
//   createdById: string;
//   scheduledAt: Date | null;
//   createdAt: Date;
//   updatedAt: Date;
//   remark: string | null;
//   status: string;
//   createdBy: QuotationUser;
// };

// export type GetQuotationByIdData = {
//   id: string;
//   customerId: string;
//   createdById: string;
//   updatedById: string | null;
//   createdAt: Date;
//   updatedAt: Date;

//   customer: QuotationCustomer | null;
//   items: QuotationItem[];
//   followups: QuotationFollowup[];
//   createdBy: QuotationUser | null;
//   updatedBy: QuotationUser | null;

//   subtotal: number;
// };

import { getQuotationByIdAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationByIdAction";

export type GetQuotationByIdActionResponse = Awaited<
  ReturnType<typeof getQuotationByIdAction>
>;

export type GetQuotationByIdData = Extract<
  GetQuotationByIdActionResponse,
  { ok: true }
>["quotation"];
