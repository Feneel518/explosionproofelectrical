import "server-only";
import { prisma } from "@/lib/prisma/db";
import transporter from "./nodemailer";

export async function dispatchEmailOutbox(id?: string) {
  const now = new Date();
  await prisma.emailOutbox.updateMany({ where: { status: "PROCESSING", attempts: { gte: 5 }, lockedUntil: { lt: now } }, data: { status: "FAILED", lockedUntil: null, lastError: "Delivery did not complete. Check the mail service and retry from enquiries." } });
  const candidates = await prisma.emailOutbox.findMany({
    where: { ...(id ? { id } : {}), attempts: { lt: 5 }, nextAttemptAt: { lte: now }, OR: [{ status: "PENDING" }, { status: "PROCESSING", lockedUntil: { lt: now } }] },
    orderBy: { nextAttemptAt: "asc" }, take: 1,
  });
  let sent = 0;
  for (const mail of candidates) {
    const lease = new Date(Date.now() + 120_000);
    const claim = await prisma.emailOutbox.updateMany({ where: { id: mail.id, attempts: mail.attempts,
      OR: [{ status: "PENDING" }, { status: "PROCESSING", lockedUntil: { lt: now } }] },
      data: { status: "PROCESSING", lockedUntil: lease, attempts: { increment: 1 } } });
    if (claim.count !== 1) continue;
    try {
      await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.EMAIL_USER, to: mail.recipient, replyTo: mail.replyTo || undefined, subject: mail.subject, html: mail.html });
      await prisma.emailOutbox.updateMany({ where: { id: mail.id, status: "PROCESSING", lockedUntil: lease }, data: { status: "SENT", sentAt: new Date(), lockedUntil: null, lastError: null } });
      sent++;
    } catch {
      await prisma.emailOutbox.updateMany({ where: { id: mail.id, status: "PROCESSING", lockedUntil: lease }, data: {
        status: mail.attempts + 1 >= 5 ? "FAILED" : "PENDING", lockedUntil: null,
        nextAttemptAt: new Date(Date.now() + 60_000 * 2 ** mail.attempts), lastError: "Notification delivery failed. Check the mail service before retrying.",
      } });
    }
  }
  return { sent };
}
