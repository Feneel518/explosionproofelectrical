import { sendEmail } from "@/lib/actions/emails/send-emails.action";

export async function sendProductApprovalEmail({
  email,
  title,
  type,
}: {
  email: string;
  title: string;
  type: "PRODUCT_CREATE" | "VARIANT_CREATE";
}) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";
  const label = type === "PRODUCT_CREATE" ? "product" : "product variant";

  try {
    return await sendEmail(email, `Approval required: ${title}`, {
    description: `A new ${label} build, “${title}”, is waiting for your approval. It has not been added to the live catalogue.`,
    link: new URL("/superadmin", baseUrl).toString(),
    });
  } catch {
    // The request is already saved; notification failures must not invite resubmission.
    return { error: "Approval notification could not be sent." };
  }
}
