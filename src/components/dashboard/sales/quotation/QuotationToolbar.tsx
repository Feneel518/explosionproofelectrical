"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebounce";
import {
  getFinancialYearLabelFromStartYear,
  getFinancialYearStartYear,
} from "@/lib/helpers/globalHelpers/financialYear";
import {
  LEAD_PLATFORMS,
  QUOTATION_FOLLOWUPS,
  QUOTATION_SORTS,
  QUOTATION_STATUSES,
  quotationParsers,
  QuotationQP,
  TrashFilter,
} from "@/lib/searchParams/dashboard/sales/quotation/QuotationSearchParams";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import React, { FC } from "react";

interface QuotationToolbarProps {
  qp: QuotationQP;
  categories: { id: string; name: string }[];
}

// FY-start-year list (so Feb 2026 => default is 2025)
const FY_YEARS = Array.from(
  { length: 10 },
  (_, i) => getFinancialYearStartYear() - i,
);

const QuotationToolbar: FC<QuotationToolbarProps> = ({ qp, categories }) => {
  const [state, setState] = useQueryStates(quotationParsers, {
    shallow: false,
  });

  // Defaults based on *today's* financial year
  const defaultYear = getFinancialYearStartYear();
  const defaultFy = getFinancialYearLabelFromStartYear(defaultYear);

  // Selected FY start year (not calendar year)
  const selectedYear = state.year ?? defaultYear;
  const fy = getFinancialYearLabelFromStartYear(selectedYear);

  // Search input (local -> debounced -> URL)
  const [search, setSearch] = React.useState(state.q ?? "");
  const debouncedSearch = useDebouncedValue(search, 500);

  React.useEffect(() => {
    setState({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch, setState]);

  // Keep `fy` synced with selected `year`
  React.useEffect(() => {
    if (state.fy !== fy) {
      setState({ fy, page: 1 });
    }
  }, [fy, state.fy, setState]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.categoryId !== "ALL" ? 1 : 0) +
    (qp.status !== "ALL" ? 1 : 0) +
    (qp.platform !== "ALL" ? 1 : 0) +
    (qp.fy !== defaultFy ? 1 : 0) +
    (qp.year !== defaultYear ? 1 : 0) +
    (qp.customerId ? 1 : 0) +
    (typeof qp.hasCustomer === "boolean" ? 1 : 0) +
    (typeof qp.needsFollowup === "boolean" ? 1 : 0) +
    (typeof qp.followupOverdue === "boolean" ? 1 : 0) +
    (qp.dateFrom ? 1 : 0) +
    (qp.dateTo ? 1 : 0) +
    (qp.trash !== "EXCLUDE" ? 1 : 0) +
    (qp.followUp !== "ALL" ? 1 : 0);

  const reset = () => {
    setState({
      q: "",
      categoryId: "ALL",
      status: "ALL",
      platform: "ALL",
      year: defaultYear,
      fy: defaultFy,
      customerId: "",
      hasCustomer: null as any,
      needsFollowup: null as any,
      followupOverdue: null as any,
      dateFrom: "",
      dateTo: "",
      trash: "EXCLUDE",
      sort: "createdAt",
      dir: "desc",
      page: 1,
      followUp: "ALL",
    });
    setSearch("");
  };
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className=" gap-3 md:items-center grid max-md:grid-cols-2 grid-cols-4 flex-wrap">
        <div className="">
          <h3>Search</h3>
          <Input
            className="md:w-[320px] max-md:col-span-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quote no / client / phone / email…"
          />
        </div>
        <div className="">
          <h3>Category</h3>
          <Select
            value={state.categoryId ?? "ALL"}
            onValueChange={(v) => setState({ categoryId: v, page: 1 })}>
            <SelectTrigger className="w-full ">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="">
          <h3>Status</h3>
          <Select
            value={state.status ?? "ALL"}
            onValueChange={(v) => setState({ status: v as any, page: 1 })}>
            <SelectTrigger className="w-full ">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {QUOTATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="">
          <h3>Platform</h3>
          <Select
            value={state.platform ?? "ALL"}
            onValueChange={(v) => setState({ platform: v as any, page: 1 })}>
            <SelectTrigger className="w-full ">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="">
          <h3>Followup</h3>
          <Select
            value={state.followUp ?? "ALL"}
            onValueChange={(v) => setState({ followUp: v as any, page: 1 })}>
            <SelectTrigger className="w-full ">
              <SelectValue placeholder="Follow Up" />
            </SelectTrigger>
            <SelectContent>
              {QUOTATION_FOLLOWUPS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ✅ Financial Year Start Year Selector */}
        <div className="">
          <h3>Year</h3>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => {
              const year = Number(v);
              setState({
                year,
                fy: getFinancialYearLabelFromStartYear(year),
                page: 1,
              });
            }}>
            <SelectTrigger className="w-full ">
              <SelectValue placeholder="FY Year" />
            </SelectTrigger>
            <SelectContent>
              {FY_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} ({getFinancialYearLabelFromStartYear(y)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* FY hint */}
        <div className="hidden md:flex items-center justify-center w-full h-full text-xs text-muted-foreground">
          FY: <span className="ml-1 font-medium text-foreground">{fy}</span>
        </div>

        <div className="">
          <h3>Deleted</h3>
          <Select
            value={state.trash ?? "EXCLUDE"}
            onValueChange={(v) => setState({ trash: v as any, page: 1 })}>
            <SelectTrigger className="w-full ">
              <SelectValue placeholder="Trash" />
            </SelectTrigger>
            <SelectContent>
              {TrashFilter.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="">
          <h3>Sort</h3>
          <Select
            value={`${state.sort ?? "createdAt"}:${state.dir ?? "desc"}`}
            onValueChange={(v) => {
              const [sort, dir] = v.split(":");
              setState({ sort: sort as any, dir: dir as any, page: 1 });
            }}>
            <SelectTrigger className="w-full ">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {QUOTATION_SORTS.map((s) => (
                <div key={s}>
                  <SelectItem value={`${s}:asc`}>Sort: {s} (asc)</SelectItem>
                  <SelectItem value={`${s}:desc`}>Sort: {s} (desc)</SelectItem>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFilters > 0 && (
          <Button variant="outline" onClick={reset}>
            <X className="mr-2 h-4 w-4" />
            Reset ({activeFilters})
          </Button>
        )}
      </div>

      <Button asChild>
        <Link href="/dashboard/sales/quotations/new">
          <Plus className="mr-2 h-4 w-4" />
          New Quotation
        </Link>
      </Button>
    </div>
  );
};

export default QuotationToolbar;
