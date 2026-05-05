"use client";

import * as React from "react";
import { useQueryStates } from "nuqs";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ContractorCatalogStatusOptions,
  ContractorRoleFilterOptions,
  RateCatalogQP,
  RateCatalogSort,
  rateCatalogParsers,
  SortDir,
} from "@/lib/searchParams/dashboard/contractors/rateCatalogSearchParams";

type Option = {
  id: string;
  name: string;
};

export default function RateCatalogFilters({
  qp,
  products,
  operations,
}: {
  qp: RateCatalogQP;
  products: Option[];
  operations: Option[];
}) {
  const [, setState] = useQueryStates(rateCatalogParsers, {
    shallow: false,
  });
  const [q, setQ] = React.useState(qp.q);
  const debouncedQ = useDebouncedValue(q, 500);

  React.useEffect(() => {
    setQ(qp.q);
  }, [qp.q]);

  React.useEffect(() => {
    const normalizedQ = debouncedQ.trim();
    if (normalizedQ === qp.q) return;
    void setState({ q: normalizedQ, page: 1 });
  }, [debouncedQ, qp.q, setState]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.productId ? 1 : 0) +
    (qp.operationId ? 1 : 0) +
    (qp.status !== "ALL" ? 1 : 0) +
    (qp.role !== "ALL" ? 1 : 0) +
    (qp.sort !== "createdAt" ? 1 : 0) +
    (qp.dir !== "desc" ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Rate Rows</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-6">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product / operation / side"
        />
        <Select
          value={qp.productId || "ALL"}
          onValueChange={(value) =>
            void setState({ productId: value === "ALL" ? "" : value, page: 1 })
          }>
          <SelectTrigger>
            <SelectValue placeholder="All products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All products</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={qp.operationId || "ALL"}
          onValueChange={(value) =>
            void setState({ operationId: value === "ALL" ? "" : value, page: 1 })
          }>
          <SelectTrigger>
            <SelectValue placeholder="All operations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All operations</SelectItem>
            {operations.map((operation) => (
              <SelectItem key={operation.id} value={operation.id}>
                {operation.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={qp.status}
          onValueChange={(value) =>
            void setState({
              status: value as (typeof ContractorCatalogStatusOptions)[number],
              page: 1,
            })
          }>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {ContractorCatalogStatusOptions.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={qp.role}
          onValueChange={(value) =>
            void setState({
              role: value as (typeof ContractorRoleFilterOptions)[number],
              page: 1,
            })
          }>
          <SelectTrigger>
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ContractorRoleFilterOptions.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select
            value={`${qp.sort}:${qp.dir}`}
            onValueChange={(value) => {
              const [sort, dir] = value.split(":");
              void setState({
                sort: sort as (typeof RateCatalogSort)[number],
                dir: dir as (typeof SortDir)[number],
                page: 1,
              });
            }}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {RateCatalogSort.map((sort) => (
                <React.Fragment key={sort}>
                  <SelectItem value={`${sort}:asc`}>{sort} (asc)</SelectItem>
                  <SelectItem value={`${sort}:desc`}>{sort} (desc)</SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
          {activeFilters > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQ("");
                void setState({
                  q: "",
                  productId: "",
                  operationId: "",
                  status: "ALL",
                  role: "ALL",
                  sort: "createdAt",
                  dir: "desc",
                  page: 1,
                  pageSize: 25,
                });
              }}>
              <X className="mr-2 h-4 w-4" />
              Reset ({activeFilters})
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
