"use client";

import * as React from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateProductSerialsAction } from "@/lib/actions/dashboard/serial/generateProductSerialsAction";

type ProductOption = {
  id: string;
  name: string;
  serialPrefix: string | null;
  lastNumber: number;
};

export default function SerialGenerator({ products }: { products: ProductOption[] }) {
  const currentYear = new Date().getFullYear();
  const [productId, setProductId] = React.useState("");
  const [prefix, setPrefix] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [year, setYear] = React.useState(currentYear);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState<null | {
    batchId: string;
    firstSerial: string;
    lastSerial: string;
    quantity: number;
  }>(null);

  const selected = products.find((product) => product.id === productId);
  const nextStart = (selected?.lastNumber ?? 0) + 1;
  const nextEnd = nextStart + Math.max(1, Number(quantity || 1)) - 1;

  function selectProduct(id: string) {
    setProductId(id);
    const product = products.find((row) => row.id === id);
    setPrefix(product?.serialPrefix ?? "");
    setGenerated(null);
  }

  async function generate() {
    setIsGenerating(true);
    try {
      const result = await generateProductSerialsAction({ productId, prefix, quantity, year });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setGenerated(result);
      toast.success(`${result.quantity} serial numbers generated`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate serial numbers</CardTitle>
        <CardDescription>Select a product and create the next continuous range.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={selectProduct}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Product code</Label>
            <Input value={prefix} onChange={(event) => setPrefix(event.target.value.toUpperCase())} placeholder="WG" maxLength={10} />
          </div>
          <div className="space-y-2">
            <Label>Manufacturing year</Label>
            <Input type="number" min={2000} max={2099} value={year} onChange={(event) => setYear(Number(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" min={1} max={1000} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))} />
          </div>
          <div className="rounded-md border p-3 text-sm">
            <div className="text-muted-foreground">Last generated</div>
            <div className="font-semibold">{selected?.lastNumber ?? 0}</div>
          </div>
          <div className="rounded-md border p-3 text-sm md:col-span-2">
            <div className="text-muted-foreground">Next numeric range</div>
            <div className="font-semibold">{nextStart}–{nextEnd}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={generate} disabled={!productId || !prefix || isGenerating}>
            {isGenerating ? "Generating..." : "Generate serials"}
          </Button>
          {generated ? (
            <Button type="button" variant="outline" onClick={() => window.open(`/dashboard/serial/print/${generated.batchId}`, "_blank")}>
              <Printer className="mr-2 size-4" /> Print labels
            </Button>
          ) : null}
        </div>

        {generated ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            Generated {generated.quantity} serials: <strong>{generated.firstSerial}</strong> through <strong>{generated.lastSerial}</strong>.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
