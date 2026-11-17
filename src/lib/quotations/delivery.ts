import { GmailApiError } from "../gmail/google";
import { GmailSendUncertainError } from "../gmail/send";

export type DeliveryResult = { ok: boolean; message: string; uncertain?: boolean };
type DeliveryState = "NEW" | "PENDING" | "SENT" | "FAILED" | "UNKNOWN";

export class QuotationPreparationError extends Error {}

/** Claim before preparing/sending. Replaying a request never calls Gmail twice. */
export async function deliverQuotation<T>(steps: {
  claim: () => Promise<DeliveryState>;
  prepare: () => Promise<T>;
  send: (prepared: T) => Promise<string>;
  record: (status: "SENT" | "FAILED" | "UNKNOWN", messageId?: string) => Promise<void>;
}): Promise<DeliveryResult> {
  const state = await steps.claim();
  if (state === "SENT") return { ok: true, message: "This quotation email was already sent successfully." };
  if (state === "PENDING" || state === "UNKNOWN") return { ok: false, uncertain: true, message: "This send attempt is pending or unconfirmed. Check Gmail Sent before starting another send." };
  if (state === "FAILED") return { ok: false, message: "This attempt failed. Close and reopen the dialog to try again." };
  let prepared: T;
  try { prepared = await steps.prepare(); }
  catch (error) {
    await steps.record("FAILED");
    return { ok: false, message: error instanceof GmailApiError || error instanceof QuotationPreparationError
      ? error.message : "Could not prepare the quotation email. Check the PDF preview and try again." };
  }
  let messageId: string;
  try { messageId = await steps.send(prepared); }
  catch (error) {
    const uncertain = !(error instanceof GmailApiError);
    await steps.record(uncertain ? "UNKNOWN" : "FAILED").catch(() => { /* PENDING also blocks a replay. */ });
    return { ok: false, uncertain, message: uncertain ? new GmailSendUncertainError().message : error.message };
  }
  // An accepted Gmail send remains successful even if saving its local receipt fails.
  try { await steps.record("SENT", messageId); }
  catch { return { ok: true, message: "Quotation sent. Its local receipt could not be saved; check Gmail Sent for the email." }; }
  return { ok: true, message: "Quotation sent with the PDF attached." };
}
