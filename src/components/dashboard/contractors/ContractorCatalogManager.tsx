"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";
import { useQueryStates } from "nuqs";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  saveContractorProductAction,
  toggleContractorProductArchiveAction,
} from "@/lib/actions/dashboard/contractors/contractorProducts/SaveContractorProduct";
import {
  saveContractorOperationAction,
  toggleContractorOperationArchiveAction,
} from "@/lib/actions/dashboard/contractors/contractorOperations/SaveContractorOperation";
import {
  saveContractorRateAction,
  toggleContractorRateArchiveAction,
} from "@/lib/actions/dashboard/contractors/contractorRates/SaveContractorRate";
import {
  CONTRACTOR_CATALOG_STATUSES,
  CONTRACTOR_WORKER_ROLES,
} from "@/lib/constants/contractors";
import { buildContractorRateLabel } from "@/lib/helpers/globalHelpers/contractorLabels";
import { rateCatalogParsers } from "@/lib/searchParams/dashboard/contractors/rateCatalogSearchParams";

type Product = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  deletedAt: Date | null;
  rateCount: number;
};

type Operation = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  deletedAt: Date | null;
  rateCount: number;
};

type Rate = {
  id: string;
  sideLabel: string | null;
  unit: string;
  defaultRate: number;
  role: (typeof CONTRACTOR_WORKER_ROLES)[number] | null;
  status: "ACTIVE" | "INACTIVE";
  notes: string | null;
  deletedAt: Date | null;
  contractorProductId: string;
  contractorOperationId: string;
  contractorProduct: { name: string };
  contractorOperation: { name: string };
};

type ProductFormState = {
  id?: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
};

type OperationFormState = {
  id?: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
};

type RateFormState = {
  id?: string;
  contractorProductId: string;
  contractorOperationId: string;
  sideLabel: string;
  unit: string;
  defaultRate: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
  notes: string;
};

type WorkerRoleValue = (typeof CONTRACTOR_WORKER_ROLES)[number];

const money = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ContractorCatalogManager({
  products,
  operations,
  rates,
  totalRates,
  page,
  pageSize,
}: {
  products: Product[];
  operations: Operation[];
  rates: Rate[];
  totalRates: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [, setState] = useQueryStates(rateCatalogParsers, {
    shallow: false,
  });
  const [pending, startTransition] = React.useTransition();
  const totalPages = Math.max(1, Math.ceil(totalRates / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const startRow = totalRates === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRates);

  const [productForm, setProductForm] = React.useState<ProductFormState>({
    name: "",
    description: "",
    status: "ACTIVE",
  });
  const [operationForm, setOperationForm] = React.useState<OperationFormState>({
    name: "",
    description: "",
    status: "ACTIVE",
  });
  const [rateForm, setRateForm] = React.useState<RateFormState>({
    contractorProductId: products[0]?.id ?? "",
    contractorOperationId: operations[0]?.id ?? "",
    sideLabel: "",
    unit: "Nos",
    defaultRate: "",
    role: "",
    status: "ACTIVE",
    notes: "",
  });
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [editingOperation, setEditingOperation] = React.useState<Operation | null>(null);
  const [editingRate, setEditingRate] = React.useState<Rate | null>(null);
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [operationDialogOpen, setOperationDialogOpen] = React.useState(false);
  const [rateDialogOpen, setRateDialogOpen] = React.useState(false);
  const [productEditForm, setProductEditForm] = React.useState<ProductFormState>({
    id: "",
    name: "",
    description: "",
    status: "ACTIVE",
  });
  const [operationEditForm, setOperationEditForm] = React.useState<OperationFormState>({
    id: "",
    name: "",
    description: "",
    status: "ACTIVE",
  });
  const [rateEditForm, setRateEditForm] = React.useState<RateFormState>({
    id: "",
    contractorProductId: products[0]?.id ?? "",
    contractorOperationId: operations[0]?.id ?? "",
    sideLabel: "",
    unit: "Nos",
    defaultRate: "",
    role: "",
    status: "ACTIVE",
    notes: "",
  });

  React.useEffect(() => {
    if (products.length === 0 || productForm.id) return;
    setRateForm((current) => ({
      ...current,
      contractorProductId: current.contractorProductId || products[0]?.id || "",
    }));
  }, [productForm.id, products]);

  React.useEffect(() => {
    if (operations.length === 0 || rateForm.id) return;
    setRateForm((current) => ({
      ...current,
      contractorOperationId: current.contractorOperationId || operations[0]?.id || "",
    }));
  }, [operations, rateForm.id]);

  const resetCreateProductForm = () =>
    setProductForm({ name: "", description: "", status: "ACTIVE" });
  const resetCreateOperationForm = () =>
    setOperationForm({ name: "", description: "", status: "ACTIVE" });
  const resetCreateRateForm = () =>
    setRateForm({
      contractorProductId: products[0]?.id ?? "",
      contractorOperationId: operations[0]?.id ?? "",
      sideLabel: "",
      unit: "Nos",
      defaultRate: "",
      role: "",
      status: "ACTIVE",
      notes: "",
    });

  const openProductEditor = (product: Product) => {
    setEditingProduct(product);
    setProductEditForm({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      status: product.status,
    });
    setProductDialogOpen(true);
  };

  const openOperationEditor = (operation: Operation) => {
    setEditingOperation(operation);
    setOperationEditForm({
      id: operation.id,
      name: operation.name,
      description: operation.description ?? "",
      status: operation.status,
    });
    setOperationDialogOpen(true);
  };

  const openRateEditor = (rate: Rate) => {
    setEditingRate(rate);
    setRateEditForm({
      id: rate.id,
      contractorProductId: rate.contractorProductId,
      contractorOperationId: rate.contractorOperationId,
      sideLabel: rate.sideLabel ?? "",
      unit: rate.unit,
      defaultRate: String(rate.defaultRate),
      role: rate.role ?? "",
      status: rate.status,
      notes: rate.notes ?? "",
    });
    setRateDialogOpen(true);
  };

  const onSaveProduct = () => {
    startTransition(async () => {
      const result = await saveContractorProductAction({
        id: productForm.id,
        name: productForm.name,
        description: productForm.description || null,
        status: productForm.status,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      resetCreateProductForm();
    });
  };

  const onSaveOperation = () => {
    startTransition(async () => {
      const result = await saveContractorOperationAction({
        id: operationForm.id,
        name: operationForm.name,
        description: operationForm.description || null,
        status: operationForm.status,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      resetCreateOperationForm();
    });
  };

  const onSaveRate = () => {
    startTransition(async () => {
      const result = await saveContractorRateAction({
        id: rateForm.id,
        contractorProductId: rateForm.contractorProductId,
        contractorOperationId: rateForm.contractorOperationId,
        sideLabel: rateForm.sideLabel || null,
        unit: rateForm.unit || "Nos",
        defaultRate: Number(rateForm.defaultRate || 0),
        role: rateForm.role ? (rateForm.role as WorkerRoleValue) : null,
        status: rateForm.status,
        notes: rateForm.notes || null,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      resetCreateRateForm();
    });
  };

  const onSaveProductEdit = () => {
    startTransition(async () => {
      const result = await saveContractorProductAction({
        id: productEditForm.id,
        name: productEditForm.name,
        description: productEditForm.description || null,
        status: productEditForm.status,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setProductDialogOpen(false);
      setEditingProduct(null);
    });
  };

  const onSaveOperationEdit = () => {
    startTransition(async () => {
      const result = await saveContractorOperationAction({
        id: operationEditForm.id,
        name: operationEditForm.name,
        description: operationEditForm.description || null,
        status: operationEditForm.status,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOperationDialogOpen(false);
      setEditingOperation(null);
    });
  };

  const onSaveRateEdit = () => {
    startTransition(async () => {
      const result = await saveContractorRateAction({
        id: rateEditForm.id,
        contractorProductId: rateEditForm.contractorProductId,
        contractorOperationId: rateEditForm.contractorOperationId,
        sideLabel: rateEditForm.sideLabel || null,
        unit: rateEditForm.unit || "Nos",
        defaultRate: Number(rateEditForm.defaultRate || 0),
        role: rateEditForm.role ? (rateEditForm.role as WorkerRoleValue) : null,
        status: rateEditForm.status,
        notes: rateEditForm.notes || null,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setRateDialogOpen(false);
      setEditingRate(null);
    });
  };

  const toggleArchive = (
    type: "product" | "operation" | "rate",
    id: string,
    archived: boolean,
  ) => {
    startTransition(async () => {
      const result =
        type === "product"
          ? await toggleContractorProductArchiveAction(id, archived)
          : type === "operation"
            ? await toggleContractorOperationArchiveAction(id, archived)
            : await toggleContractorRateArchiveAction(id, archived);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              {productForm.id ? "Edit Contractor Product" : "New Contractor Product"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="e.g. Wellglass"
              value={productForm.name}
              onChange={(e) =>
                setProductForm((current) => ({ ...current, name: e.target.value }))
              }
            />
            <Textarea
              placeholder="Optional notes about the product"
              rows={3}
              value={productForm.description}
              onChange={(e) =>
                setProductForm((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
            />
            <Select
              value={productForm.status}
              onValueChange={(value) =>
                setProductForm((current) => ({
                  ...current,
                  status: value as "ACTIVE" | "INACTIVE",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACTOR_CATALOG_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button type="button" onClick={onSaveProduct} disabled={pending}>
                Create Product
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {operationForm.id ? "Edit Operation" : "New Operation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="e.g. Threading"
              value={operationForm.name}
              onChange={(e) =>
                setOperationForm((current) => ({ ...current, name: e.target.value }))
              }
            />
            <Textarea
              placeholder="Optional notes about the operation"
              rows={3}
              value={operationForm.description}
              onChange={(e) =>
                setOperationForm((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
            />
            <Select
              value={operationForm.status}
              onValueChange={(value) =>
                setOperationForm((current) => ({
                  ...current,
                  status: value as "ACTIVE" | "INACTIVE",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACTOR_CATALOG_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button type="button" onClick={onSaveOperation} disabled={pending}>
                Create Operation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{rateForm.id ? "Edit Rate Row" : "New Rate Row"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={rateForm.contractorProductId || undefined}
              onValueChange={(value) =>
                setRateForm((current) => ({
                  ...current,
                  contractorProductId: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((product) => !product.deletedAt)
                  .map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={rateForm.contractorOperationId || undefined}
              onValueChange={(value) =>
                setRateForm((current) => ({
                  ...current,
                  contractorOperationId: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                {operations
                  .filter((operation) => !operation.deletedAt)
                  .map((operation) => (
                    <SelectItem key={operation.id} value={operation.id}>
                      {operation.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Side / part, e.g. Ring"
                value={rateForm.sideLabel}
                onChange={(e) =>
                  setRateForm((current) => ({
                    ...current,
                    sideLabel: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="Unit"
                value={rateForm.unit}
                onChange={(e) =>
                  setRateForm((current) => ({ ...current, unit: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Rate"
                value={rateForm.defaultRate}
                onChange={(e) =>
                  setRateForm((current) => ({
                    ...current,
                    defaultRate: e.target.value,
                  }))
                }
              />
              <Select
                value={rateForm.role || "ALL"}
                onValueChange={(value) =>
                  setRateForm((current) => ({
                    ...current,
                    role: value === "ALL" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  {CONTRACTOR_WORKER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select
              value={rateForm.status}
              onValueChange={(value) =>
                setRateForm((current) => ({
                  ...current,
                  status: value as "ACTIVE" | "INACTIVE",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACTOR_CATALOG_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Optional notes"
              rows={3}
              value={rateForm.notes}
              onChange={(e) =>
                setRateForm((current) => ({ ...current, notes: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <Button type="button" onClick={onSaveRate} disabled={pending}>
                Create Rate Row
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contractor Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible>
              <AccordionItem value="contractor-products" className="rounded-xl border px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Product List</div>
                    <div className="text-xs text-muted-foreground">
                      {products.length} product{products.length === 1 ? "" : "s"} in catalog
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="rounded-xl border p-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-white">Name</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-right text-white">Rates</TableHead>
                          <TableHead className="text-right text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="font-medium">{product.name}</div>
                              {product.description ? (
                                <div className="text-xs text-muted-foreground">
                                  {product.description}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  product.status === "ACTIVE" ? "default" : "secondary"
                                }
                              >
                                {product.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{product.rateCount}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openProductEditor(product)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    toggleArchive("product", product.id, !product.deletedAt)
                                  }
                                >
                                  {product.deletedAt ? "Restore" : "Archive"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible>
              <AccordionItem value="operations" className="rounded-xl border px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Operation List</div>
                    <div className="text-xs text-muted-foreground">
                      {operations.length} operation{operations.length === 1 ? "" : "s"} in
                      catalog
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="rounded-xl border p-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-white">Name</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-right text-white">Rates</TableHead>
                          <TableHead className="text-right text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operations.map((operation) => (
                          <TableRow key={operation.id}>
                            <TableCell>
                              <div className="font-medium">{operation.name}</div>
                              {operation.description ? (
                                <div className="text-xs text-muted-foreground">
                                  {operation.description}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  operation.status === "ACTIVE" ? "default" : "secondary"
                                }
                              >
                                {operation.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{operation.rateCount}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openOperationEditor(operation)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    toggleArchive(
                                      "operation",
                                      operation.id,
                                      !operation.deletedAt,
                                    )
                                  }
                                >
                                  {operation.deletedAt ? "Restore" : "Archive"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate Rows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Work Row</TableHead>
                  <TableHead className="text-white">Role</TableHead>
                  <TableHead className="text-white">Unit</TableHead>
                  <TableHead className="text-right text-white">Rate</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-right text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No rate rows found for the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div className="font-medium">
                          {buildContractorRateLabel({
                            productName: rate.contractorProduct.name,
                            operationName: rate.contractorOperation.name,
                            sideLabel: rate.sideLabel,
                          })}
                        </div>
                        {rate.notes ? (
                          <div className="text-xs text-muted-foreground">{rate.notes}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>{rate.role ?? "ALL"}</TableCell>
                      <TableCell>{rate.unit}</TableCell>
                      <TableCell className="text-right">{money(rate.defaultRate)}</TableCell>
                      <TableCell>
                        <Badge variant={rate.status === "ACTIVE" ? "default" : "secondary"}>
                          {rate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openRateEditor(rate)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleArchive("rate", rate.id, !rate.deletedAt)}
                          >
                            {rate.deletedAt ? "Restore" : "Archive"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Showing {startRow} to {endRow} of {totalRates} rate rows
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) =>
                  void setState({ pageSize: Number(value), page: 1 })
                }>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                disabled={!canPrev}
                onClick={() => void setState({ page: page - 1 })}
              >
                Previous
              </Button>
              <div className="min-w-[90px] text-center text-sm">
                Page {page} of {totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!canNext}
                onClick={() => void setState({ page: page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details and save the changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="e.g. Wellglass"
              value={productEditForm.name}
              onChange={(e) =>
                setProductEditForm((current) => ({ ...current, name: e.target.value }))
              }
            />
            <Textarea
              placeholder="Optional notes about the product"
              rows={3}
              value={productEditForm.description}
              onChange={(e) =>
                setProductEditForm((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
            />
            <Select
              value={productEditForm.status}
              onValueChange={(value) =>
                setProductEditForm((current) => ({
                  ...current,
                  status: value as "ACTIVE" | "INACTIVE",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACTOR_CATALOG_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={onSaveProductEdit} disabled={pending || !editingProduct}>
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={operationDialogOpen} onOpenChange={setOperationDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Operation</DialogTitle>
            <DialogDescription>
              Update the operation details and save the changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="e.g. Threading"
              value={operationEditForm.name}
              onChange={(e) =>
                setOperationEditForm((current) => ({ ...current, name: e.target.value }))
              }
            />
            <Textarea
              placeholder="Optional notes about the operation"
              rows={3}
              value={operationEditForm.description}
              onChange={(e) =>
                setOperationEditForm((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
            />
            <Select
              value={operationEditForm.status}
              onValueChange={(value) =>
                setOperationEditForm((current) => ({
                  ...current,
                  status: value as "ACTIVE" | "INACTIVE",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACTOR_CATALOG_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={onSaveOperationEdit} disabled={pending || !editingOperation}>
              Save Operation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Edit Rate Row</DialogTitle>
            <DialogDescription>
              Change the product, operation, rate, role, or notes and save the row.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={rateEditForm.contractorProductId || undefined}
              onValueChange={(value) =>
                setRateEditForm((current) => ({
                  ...current,
                  contractorProductId: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((product) => !product.deletedAt)
                  .map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={rateEditForm.contractorOperationId || undefined}
              onValueChange={(value) =>
                setRateEditForm((current) => ({
                  ...current,
                  contractorOperationId: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                {operations
                  .filter((operation) => !operation.deletedAt)
                  .map((operation) => (
                    <SelectItem key={operation.id} value={operation.id}>
                      {operation.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Side / part, e.g. Ring"
                value={rateEditForm.sideLabel}
                onChange={(e) =>
                  setRateEditForm((current) => ({
                    ...current,
                    sideLabel: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="Unit"
                value={rateEditForm.unit}
                onChange={(e) =>
                  setRateEditForm((current) => ({ ...current, unit: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Rate"
                value={rateEditForm.defaultRate}
                onChange={(e) =>
                  setRateEditForm((current) => ({
                    ...current,
                    defaultRate: e.target.value,
                  }))
                }
              />
              <Select
                value={rateEditForm.role || "ALL"}
                onValueChange={(value) =>
                  setRateEditForm((current) => ({
                    ...current,
                    role: value === "ALL" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  {CONTRACTOR_WORKER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select
              value={rateEditForm.status}
              onValueChange={(value) =>
                setRateEditForm((current) => ({
                  ...current,
                  status: value as "ACTIVE" | "INACTIVE",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACTOR_CATALOG_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Optional notes"
              rows={3}
              value={rateEditForm.notes}
              onChange={(e) =>
                setRateEditForm((current) => ({ ...current, notes: e.target.value }))
              }
            />
          </div>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={onSaveRateEdit} disabled={pending || !editingRate}>
              Save Rate Row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
