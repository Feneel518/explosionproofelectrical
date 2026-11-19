import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { decryptGmailSecret } from "@/lib/gmail/crypto";
import { exchangeGmailToken, GmailApiError } from "@/lib/gmail/google";
import { getGmailAttachmentMessage, getGmailPdf, GmailAttachmentError, listGmailPdfs } from "@/lib/gmail/attachments";

export const runtime = "nodejs";
export const maxDuration = 60;
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const failure = (error: string, status: number) => NextResponse.json({ error }, { status, headers: privateHeaders });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await requirePermission("sales.read");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return failure("Invalid email alert.", 400);
  const partId = request.nextUrl.searchParams.get("partId");
  if (partId !== null && !/^\d+(?:\.\d+)*$/.test(partId)) return failure("Invalid PDF attachment.", 400);
  try {
    // Resolve the message and token together from the owner's saved alert. Never accept Gmail IDs from the browser.
    const alert = await prisma.gmailNotification.findFirst({
      where: { id, userId: user.id },
      select: { messageId: true, connection: { select: { encryptedRefreshToken: true } } },
    });
    if (!alert) return failure("Email not found. Refresh your inbox and try again.", 404);
    const tokens = await exchangeGmailToken({ grant_type: "refresh_token", refresh_token: decryptGmailSecret(alert.connection.encryptedRefreshToken) });
    const message = await getGmailAttachmentMessage(tokens.access_token, alert.messageId);
    if (partId === null) return NextResponse.json({ attachments: listGmailPdfs(message) }, { headers: privateHeaders });
    const { bytes, filename } = await getGmailPdf(tokens.access_token, message, partId);
    const safeFilename = encodeURIComponent(filename).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    return new NextResponse(new Uint8Array(bytes), { headers: {
      ...privateHeaders, "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Attachment.pdf"; filename*=UTF-8''${safeFilename}`,
      "Content-Security-Policy": "frame-ancestors 'self'", "Referrer-Policy": "no-referrer",
    } });
  } catch (error) {
    if (error instanceof GmailAttachmentError) return failure(error.message, error.status);
    if (error instanceof GmailApiError) return failure(error.status === 404 ? "This email or attachment was removed from Gmail." : error.message, error.status === 404 ? 404 : 502);
    return failure("Could not load the PDF attachments. Please try again or open the email in Gmail.", 500);
  }
}
