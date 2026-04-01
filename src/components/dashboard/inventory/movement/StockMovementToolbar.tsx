"use client";

import React from "react";
import { useQueryStates } from "nuqs";
import { X } from "lucide-react";

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
  stockMovementParsers,
  STOCK_ISSUE_TYPES,
  STOCK_MOVEMENT_SORTS,
  STOCK_MOVEMENT_TYPES,
  STOCK_REFERENCE_TYPES,
  StockMovementQP,
} from "@/lib/searchParams/dashboard/inventory/movement/StockMovementSearchParams";

export default function StockMovementToolbar({ qp }: { qp: StockMovementQP }) {
  const [state, setState] = useQueryStates(stockMovementParsers, {
    shallow: false,
  });

  const [search, setSearch] = React.useState(state.q ?? "");
  const debounced = useDebouncedValue(search, 500);

  React.useEffect(() => {
    setState({ q: debounced, page: 1 });
  }, [debounced, setState]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.movementType !== "ALL" ? 1 : 0) +
    (qp.referenceType !== "ALL" ? 1 : 0) +
    (qp.issueType !== "ALL" ? 1 : 0) +
    (qp.sort !== "movementDate" ? 1 : 0) +
    (qp.dir !== "desc" ? 1 : 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <div className="col-span-2">
        <h3>Search</h3>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search ref no / actor / remarks..."
        />
      </div>

      <div>
        <h3>Movement</h3>
        <Select
          value={state.movementType}
          onValueChange={(value) =>
            setState({ movementType: value as any, page: 1 })
          }>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Movement" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_MOVEMENT_TYPES.map((movementType) => (
              <SelectItem key={movementType} value={movementType}>
                {movementType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3>Reference</h3>
        <Select
          value={state.referenceType}
          onValueChange={(value) =>
            setState({
              referenceType: value as any,
              issueType:
                value === "MATERIAL_ISSUE" || value === "ALL"
                  ? state.issueType
                  : "ALL",
              page: 1,
            })
          }>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Reference" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_REFERENCE_TYPES.map((referenceType) => (
              <SelectItem key={referenceType} value={referenceType}>
                {referenceType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3>Issue Type</h3>
        <Select
          value={state.issueType}
          onValueChange={(value) =>
            setState({
              issueType: value as any,
              referenceType:
                value === "ALL"
                  ? state.referenceType
                  : state.referenceType === "ALL" ||
                      state.referenceType === "MATERIAL_ISSUE"
                    ? "MATERIAL_ISSUE"
                    : state.referenceType,
              page: 1,
            })
          }>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Issue Type" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_ISSUE_TYPES.map((issueType) => (
              <SelectItem key={issueType} value={issueType}>
                {issueType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3>Sort</h3>
        <Select
          value={`${state.sort}:${state.dir}`}
          onValueChange={(value) => {
            const [sort, dir] = value.split(":");
            setState({ sort: sort as any, dir: dir as any, page: 1 });
          }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_MOVEMENT_SORTS.map((sort) => (
              <React.Fragment key={sort}>
                <SelectItem value={`${sort}:asc`}>{sort} (asc)</SelectItem>
                <SelectItem value={`${sort}:desc`}>{sort} (desc)</SelectItem>
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilters > 0 ? (
        <Button
          variant="outline"
          onClick={() => {
            setState({
              q: "",
              movementType: "ALL",
              referenceType: "ALL",
              issueType: "ALL",
              sort: "movementDate",
              dir: "desc",
              page: 1,
            });
            setSearch("");
          }}>
          <X className="mr-2 h-4 w-4" />
          Reset ({activeFilters})
        </Button>
      ) : null}
    </div>
  );
}
