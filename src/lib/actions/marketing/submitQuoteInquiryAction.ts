"use server";
import { QuoteInquirySchema, type QuoteInquiryRequest } from "@/lib/validators/marketing/QuoteInquiryValidator";
import { acceptWebsiteEnquiry } from "@/lib/enquiries/accept";
import { SubmissionLimitError } from "@/lib/security/submissionLimit";
import { revalidatePath } from "next/cache";

export async function submitQuoteInquiryAction(values: QuoteInquiryRequest) {
  const parsed = QuoteInquirySchema.safeParse(values);
  if (!parsed.success) return { ok: false as const, message: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  try {
    const result = await acceptWebsiteEnquiry({ name: data.fullName, email: data.email, phone: data.phone, company: data.company, productInterest: data.productInterest, quantity: data.quantity, message: data.requirement, source: "QUOTE_FORM" });
    revalidatePath("/dashboard/enquiries");
    return { ok: true as const, ...result, message: "Request received. Our engineering team will get back to you within one business day." };
  } catch (error) {
    return { ok: false as const, message: error instanceof SubmissionLimitError ? error.message : "Unable to save your request right now. Please try again shortly." };
  }
}
