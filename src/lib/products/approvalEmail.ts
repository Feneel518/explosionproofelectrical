import { sendEmail } from "@/lib/actions/emails/send-emails.action";

export type ProductApprovalRequestKind =
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "VARIANT_CREATE"
  | "VARIANT_UPDATE";

export async function sendProductApprovalEmail({
  email,
  title,
  type,
}: {
  email: string;
  title: string;
  type: ProductApprovalRequestKind;
}) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";
  const label = type.startsWith("PRODUCT_") ? "product" : "product variant";
  const action = type.endsWith("_CREATE") ? "creation" : "edit";

  try {
    return await sendEmail(email, `Approval required: ${title}`, {
      description: `A ${label} ${action}, “${title}”, is waiting for your approval. The live catalogue has not been changed.`,
      link: new URL("/superadmin", baseUrl).toString(),
    });
  } catch {
    // The request is already saved; notification failures must not invite resubmission.
    return { error: "Approval notification could not be sent." };
  }
}
