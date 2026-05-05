"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";

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

type Option = {
  id: string;
  name: string;
};

export default function RateCatalogFilters({
  initialQ,
  initialProductId,
  initialOperationId,
  initialStatus,
  initialRole,
  products,
  operations,
  statuses,
  roles,
}: {
  initialQ: string;
  initialProductId: string;
  initialOperationId: string;
  initialStatus: string;
  initialRole: string;
  products: Option[];
  operations: Option[];
  statuses: string[];
  roles: string[];
}) {
  const router = useRouter();
  const [q, setQ] = React.useState(initialQ);
  const [productId, setProductId] = React.useState(initialProductId || "ALL");
  const [operationId, setOperationId] = React.useState(initialOperationId || "ALL");
  const [status, setStatus] = React.useState(initialStatus || "ALL");
  const [role, setRole] = React.useState(initialRole || "ALL");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (productId !== "ALL") params.set("productId", productId);
    if (operationId !== "ALL") params.set("operationId", operationId);
    if (status !== "ALL") params.set("status", status);
    if (role !== "ALL") params.set("role", role);
    router.push(`/dashboard/contractors/rate-catalog${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Rate Rows</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-5">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search product / operation / side"
        />
        <Select value={productId} onValueChange={setProductId}>
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
        <Select value={operationId} onValueChange={setOperationId}>
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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={applyFilters}>
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
