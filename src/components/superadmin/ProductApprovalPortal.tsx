"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import {
  ArrowLeft,
  BellRing,
  Boxes,
  Check,
  Clock3,
  PackageCheck,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  reviewProductApprovalAction,
  updateProductApprovalSettingsAction,
} from "@/lib/actions/superadmin/productApprovalActions";

type ApprovalItem = {
  id: string;
  type: "PRODUCT_CREATE" | "VARIANT_CREATE";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  title: string;
  createdAt: string;
  reviewedAt: string | null;
  requester: { name: string | null; email: string };
  reviewNote: string | null;
  payload: Record<string, unknown>;
};

type Settings = {
  approvalEmail: string;
  requireProductApproval: boolean;
  requireVariantApproval: boolean;
  sendEmailNotifications: boolean;
};

const ToggleRow = ({
  checked,
  onChange,
  label,
  description,
  locked = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  locked?: boolean;
}) => (
  <label className={`flex items-center justify-between gap-4 border-b border-white/10 py-4 last:border-0 ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}>
    <span>
      <span className="block text-sm font-medium text-white">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      disabled={locked}
      className="size-5 shrink-0 accent-orange-500"
    />
  </label>
);

export default function ProductApprovalPortal({
  pendingItems,
  recentItems,
  initialSettings,
  counts,
}: {
  pendingItems: ApprovalItem[];
  recentItems: ApprovalItem[];
  initialSettings: Settings;
  counts: { pending: number; approved: number; rejected: number; liveProducts: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const saveSettings = () => {
    startTransition(async () => {
      const result = await updateProductApprovalSettingsAction({
        sendEmailNotifications: settings.sendEmailNotifications,
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  };

  const review = (id: string, decision: "APPROVE" | "REJECT") => {
    startTransition(async () => {
      const result = await reviewProductApprovalAction(id, decision, notes[id]);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  };

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em] text-slate-400 transition hover:text-orange-400">
              <ArrowLeft className="size-3.5" /> Operations dashboard
            </Link>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-sm bg-orange-500 text-[#07111f] shadow-[6px_6px_0_#26374d]">
                <ShieldCheck className="size-6" />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.3em] text-orange-400">Owner control / restricted</p>
                <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Owner dashboard</h1>
                <p className="mt-2 text-sm text-slate-400">Review new products and variants as {initialSettings.approvalEmail}.</p>
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 font-mono text-xs text-emerald-300">
            <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-emerald-400" />
            APPROVAL SYSTEM ONLINE
          </div>
        </header>

        <section aria-label="Approval overview" className="mb-8 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Waiting", counts.pending, Clock3, "text-amber-300"],
            ["Approved", counts.approved, PackageCheck, "text-emerald-300"],
            ["Rejected", counts.rejected, X, "text-rose-300"],
            ["Live products", counts.liveProducts, Boxes, "text-sky-300"],
          ].map(([label, value, Icon, color]) => {
            const StatIcon = Icon as typeof Clock3;
            return (
              <div key={String(label)} className="bg-[#0c1929] p-5">
                <div className="flex items-center justify-between text-xs uppercase tracking-[.14em] text-slate-400">
                  {String(label)} <StatIcon className={`size-4 ${color}`} />
                </div>
                <div className="mt-3 font-mono text-3xl font-semibold">{String(value).padStart(2, "0")}</div>
              </div>
            );
          })}
        </section>

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_340px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.25em] text-orange-400">Incoming requests</p>
                <h2 className="mt-1 font-serif text-2xl">Waiting for your decision</h2>
              </div>
              <Badge className="rounded-sm bg-orange-500 text-white">{pendingItems.length} pending</Badge>
            </div>

            <div className="space-y-4">
              {pendingItems.length === 0 ? (
                <div className="rounded-sm border border-dashed border-white/20 bg-[#0c1929] px-6 py-16 text-center">
                  <Check className="mx-auto mb-4 size-8 text-emerald-400" />
                  <p className="font-serif text-xl">The approval queue is clear.</p>
                  <p className="mt-2 text-sm text-slate-400">New product and variant requests will appear here.</p>
                </div>
              ) : pendingItems.map((item) => (
                <article key={item.id} className="rounded-sm border border-white/10 bg-[#0c1929] shadow-[0_16px_50px_rgba(0,0,0,.2)]">
                  <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-sm border-orange-400/40 text-orange-300">
                          {item.type === "PRODUCT_CREATE" ? "NEW PRODUCT" : "NEW VARIANT"}
                        </Badge>
                        <span className="font-mono text-[11px] text-slate-500">#{item.id.slice(0, 8)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Requested by {item.requester.name || item.requester.email} · {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:text-right">
                      {Object.entries(item.payload).filter(([key, value]) =>
                        ["sku", "slug", "categoryId", "status"].includes(key) && Boolean(value)
                      ).map(([key, value]) => (
                        <div key={key}><span className="text-slate-500">{key}</span><br/><span className="font-mono text-slate-200">{String(value)}</span></div>
                      ))}
                    </div>
                  </div>
                  <details className="border-b border-white/10 p-5">
                    <summary className="cursor-pointer text-sm font-medium text-sky-300">View all submitted details</summary>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      {Object.entries(item.payload).filter(([, value]) => value != null && value !== "").map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <dt className="text-xs capitalize text-slate-400">{key.replace(/([A-Z])/g, " $1")}</dt>
                          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-100">
                            {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  <div className="flex flex-col gap-3 p-4 sm:flex-row">
                    <Input
                      value={notes[item.id] || ""}
                      onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Optional decision note"
                      maxLength={2000}
                      aria-label={`Decision note for ${item.title}`}
                      className="border-white/10 bg-[#07111f]"
                    />
                    <Button disabled={pending} variant="destructive" className="rounded-sm" onClick={() => review(item.id, "REJECT")}>
                      <X /> Reject
                    </Button>
                    <Button disabled={pending} className="rounded-sm bg-emerald-500 text-[#07111f] hover:bg-emerald-400" onClick={() => review(item.id, "APPROVE")}>
                      <Check /> Approve & create
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-8">
            <div className="rounded-sm border border-white/10 bg-[#0c1929] p-5">
              <div className="mb-2 flex items-center gap-2 text-orange-400"><SlidersHorizontal className="size-4" /><span className="font-mono text-[10px] uppercase tracking-[.22em]">Approval settings</span></div>
              <h2 className="font-serif text-xl">Creation controls</h2>
              <div className="mt-3">
                <ToggleRow checked={true} locked onChange={() => undefined} label="Approve new products · mandatory" description="Every new product stays outside the catalogue until you approve it." />
                <ToggleRow checked={true} locked onChange={() => undefined} label="Approve new variants · mandatory" description="Every new variant, including copies, is held for review." />
                <ToggleRow checked={settings.sendEmailNotifications} onChange={(checked) => setSettings({ ...settings, sendEmailNotifications: checked })} label="Email alerts" description={`Send requests to ${settings.approvalEmail}.`} />
              </div>
              <Button onClick={saveSettings} disabled={pending} className="mt-4 w-full rounded-sm">Save controls</Button>
            </div>

            <div className="rounded-sm border border-white/10 bg-[#0c1929] p-5">
              <div className="flex items-center gap-2 text-sky-300"><BellRing className="size-4" /><span className="font-mono text-[10px] uppercase tracking-[.22em]">Recent decisions</span></div>
              <div className="mt-4 space-y-4">
                {recentItems.length === 0 ? <p className="text-sm text-slate-500">No decisions yet.</p> : recentItems.map((item) => (
                  <div key={item.id} className="border-l-2 border-white/10 pl-3">
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${item.status === "APPROVED" ? "bg-emerald-400" : "bg-rose-400"}`} />
                      <span className="text-xs font-medium text-white">{item.title}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{item.status.toLowerCase()} · {new Date(item.reviewedAt || item.createdAt).toLocaleDateString()}</p>
                    {item.reviewNote && <p className="mt-1 break-words text-xs text-slate-400">{item.reviewNote}</p>}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
