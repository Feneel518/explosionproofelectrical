"use client";

import React, { FC } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  gstOptions,
  packingCharges,
  paymentTerms,
  transportationPayment,
} from "@/lib/constants/quotationData";

import {
  CustomerSelectItem,
  PendingQuotationItem,
  SalesOrderFormType,
} from "@/lib/types/SalesOrderTypes";
import { ResponsiveModal } from "@/components/dashboard/global/ResponsiveModal";
import CustomerForm from "@/components/dashboard/customer/CustomerForm";
import { CustomerCombobox } from "@/components/dashboard/global/CustomerCombobox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FileUpload } from "@/components/dashboard/global/FileUpload";

interface SalesOrderHeaderTabProps {
  form: SalesOrderFormType;
  customers: CustomerSelectItem[];
  pendingQuotations: PendingQuotationItem[];
  loadingQuotations: boolean;
  openCreateCustomer: boolean;
  setOpenCreateCustomer: React.Dispatch<React.SetStateAction<boolean>>;
  openPoDate: boolean;
  setOpenPoDate: React.Dispatch<React.SetStateAction<boolean>>;
  openOrderDate: boolean;
  setOpenOrderDate: React.Dispatch<React.SetStateAction<boolean>>;
  applyCustomerToHeader: (customerId: string | null) => void;
  applyQuotationToOrder: (quotation: any) => void;
  watchedItemsLength: number;
  totalOrderedQty: number;
  totalDispatchedQty: number;
  totalInvoicedQty: number;
  totalPendingQty: number;
  subtotal: number;
}

const SalesOrderHeaderTab: FC<SalesOrderHeaderTabProps> = ({
  form,
  pendingQuotations,
  loadingQuotations,
  openCreateCustomer,
  setOpenCreateCustomer,
  openPoDate,
  setOpenPoDate,
  openOrderDate,
  setOpenOrderDate,
  applyCustomerToHeader,
  applyQuotationToOrder,
  watchedItemsLength,
  totalOrderedQty,
  totalDispatchedQty,
  totalInvoicedQty,
  totalPendingQty,
  subtotal,
}) => {
  return (
    <>
      <ResponsiveModal
        open={openCreateCustomer}
        onOpenChange={setOpenCreateCustomer}
        trigger="">
        <CustomerForm
          mode="create"
          onCreated={(customer) => {
            const customerId = customer.id;
            const previousCustomerId = form.getValues("header.customerId") ?? null;
            const linkedQuotationId = form.getValues("header.quotationId") ?? "";

            if (linkedQuotationId && previousCustomerId !== customerId) {
              form.setValue("header.quotationId", "", { shouldDirty: true });
              form.setValue("header.sourceType", "DIRECT", { shouldDirty: true });
              form.setValue("header.isConvertedFromQuotation", false, {
                shouldDirty: true,
              });
            }

            form.setValue("header.customerId", customerId, {
              shouldDirty: true,
              shouldTouch: true,
            });

            const name = customer.companyName ?? "";

            form.setValue("header.clientName", name, {
              shouldDirty: true,
              shouldTouch: true,
            });

            form.setValue("header.clientNameSnapshot", name, {
              shouldDirty: true,
              shouldTouch: true,
            });

            form.setValue("header.citySnapshot", customer.city ?? "", {
              shouldDirty: true,
              shouldTouch: true,
            });

            form.setValue("header.stateSnapshot", customer.state ?? "", {
              shouldDirty: true,
              shouldTouch: true,
            });

            form.setValue("header.gstinSnapshot", customer.gstin ?? "", {
              shouldDirty: true,
              shouldTouch: true,
            });

            if (customer.companyPhone) {
              form.setValue("header.receivedFromPhone", customer.companyPhone, {
                shouldDirty: true,
                shouldTouch: true,
              });
            }

            if (customer.companyEmail) {
              form.setValue("header.receivedFromEmail", customer.companyEmail, {
                shouldDirty: true,
                shouldTouch: true,
              });
            }

            setOpenCreateCustomer(false);
          }}
        />
      </ResponsiveModal>

      <Card>
        <CardHeader>
          <CardTitle>Sales Order Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid lg:grid-cols-4 gap-4 gap-y-8">
            <div className="flex flex-col gap-2">
              <FormLabel>Customer</FormLabel>
              <CustomerCombobox
                value={form.watch("header.customerId")}
                onChange={(customerId) => {
                  applyCustomerToHeader(customerId);
                }}
                onCreateCustomer={() => {
                  setOpenCreateCustomer(true);
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="header.clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Client name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.sourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["DIRECT", "QUOTATION", "MANUAL", "IMPORTED"].map(
                        (item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.quotationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pending Quotation</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selected = pendingQuotations.find(
                        (q) => q.id === value,
                      );
                      if (selected) {
                        applyQuotationToOrder(selected.quotation);
                      }
                    }}
                    disabled={
                      !form.watch("header.customerId") || loadingQuotations
                    }>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingQuotations
                              ? "Loading quotations..."
                              : pendingQuotations.length
                                ? "Select quotation"
                                : "No pending quotations"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pendingQuotations.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.label} • {q.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.receivedFromName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received From Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Received from"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.receivedFromPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received From Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Phone number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.receivedFromEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received From Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="email@example.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.poNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PO Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="PO Number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.poDate"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>PO Date</FormLabel>
                  <Popover open={openPoDate} onOpenChange={setOpenPoDate}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value as Date, "PPP")
                            : "Pick PO date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={(field.value as Date) ?? undefined}
                        onSelect={(date) => {
                          field.onChange(date ?? null);
                          setOpenPoDate(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.orderDate"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Order Date</FormLabel>
                  <Popover open={openOrderDate} onOpenChange={setOpenOrderDate}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value as Date, "PPP")
                            : "Pick order date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={(field.value as Date) ?? undefined}
                        onSelect={(date) => {
                          field.onChange(date ?? null);
                          setOpenOrderDate(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.gst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select GST" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gstOptions.map((gst) => (
                        <SelectItem key={gst} value={gst}>
                          {gst}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.packingCharges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Packing Charges</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Packing charges" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {packingCharges.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.transportationPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transportation Payment</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Transportation payment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transportationPayment.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Payment terms" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentTerms.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g. 5% / 1000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header.deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="4 weeks"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="header.poFile"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      endpoint="productDrawing"
                      kind={"DRAWING"}
                      value={form.watch("header.poFile") ?? []}
                      onChange={(next) =>
                        form.setValue("header.poFile", next, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      label="Upload Po File"
                      hint=""
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="header.additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Add order notes..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card className="border-dashed">
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Items</div>
                    <div className="font-semibold">{watchedItemsLength}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Ordered Qty</div>
                    <div className="font-semibold">{totalOrderedQty}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Dispatched Qty</div>
                    <div className="font-semibold">{totalDispatchedQty}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Invoiced Qty</div>
                    <div className="font-semibold">{totalInvoicedQty}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pending Qty</div>
                    <div className="font-semibold">{totalPendingQty}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Subtotal</div>
                    <div className="font-semibold">₹{subtotal.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SalesOrderHeaderTab;
