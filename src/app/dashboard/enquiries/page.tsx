import { hasPermission } from "@/lib/check/permissionPolicy";
import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { EnquiryActions } from "@/components/dashboard/enquiries/EnquiryActions";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { user } = await requirePermission("sales.read");
  const canWrite = hasPermission(user, "sales.write");
  const rawPage = Number((await searchParams).page || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const [leads, total] = await Promise.all([
    prisma.websiteEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 25, skip: (page - 1) * 25 }),
    prisma.websiteEnquiry.count(),
  ]);
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Website enquiries</h1><p className="text-sm text-muted-foreground">Review new requirements before creating a numbered quotation. Enquiries remain saved when email is unavailable.</p></div>
    {leads.length === 0 ? <p className="rounded-lg border p-6 text-muted-foreground">No website enquiries yet. New quote and product requests will appear here.</p> : <div className="divide-y rounded-lg border">{leads.map(lead => <article className="space-y-3 p-4" key={lead.id}><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold break-words">{lead.productInterest}</h2><span className="text-sm text-muted-foreground">{lead.status} · {lead.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span></div><p className="text-sm break-words">{lead.name} · {lead.company || "Individual enquiry"} · {lead.email}{lead.phone ? ` · ${lead.phone}` : ""}{lead.quantity ? ` · Qty: ${lead.quantity}` : ""}</p><p className="whitespace-pre-wrap break-words text-sm">{lead.message}</p><EnquiryActions id={lead.id} quotationId={lead.quotationId} readOnly={!canWrite} /></article>)}</div>}
    <nav aria-label="Enquiry pagination" className="flex gap-4 text-sm">{page > 1 && <Link href={`?page=${page - 1}`}>Previous</Link>}<span>Page {page} · {total} enquiries</span>{page * 25 < total && <Link href={`?page=${page + 1}`}>Next</Link>}</nav>
  </div>;
}
