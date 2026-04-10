import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma/db";
import Link from "next/link";
import { FC } from "react";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<pageProps> = async ({ params }) => {
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      companyName: true,
      companyEmail: true,
      companyPhone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      country: true,
      pincode: true,
      gstin: true,
      status: true,
      deletedAt: true,
      createdAt: true,
    },
  });

  if (!supplier)
    return (
      <div className="text-sm text-muted-foreground">Supplier not found.</div>
    );
  return (
    <div className=" space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {supplier.companyName}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge>{supplier.status}</Badge>
            {supplier.deletedAt ? (
              <Badge variant="destructive">DELETED</Badge>
            ) : null}
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href={`/dashboard/suppliers/${supplier.id}/edit`}>Edit</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Email:</span>{" "}
          {supplier.companyEmail ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Phone:</span>{" "}
          {supplier.companyPhone ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">GSTIN:</span>{" "}
          {supplier.gstin ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Address:</span>{" "}
          {supplier.addressLine1}
          {supplier.addressLine2 ? `, ${supplier.addressLine2}` : ""},{" "}
          {supplier.city}, {supplier.state}, {supplier.country} -{" "}
          {supplier.pincode}
        </div>
        <div className="text-xs text-muted-foreground">
          Created: {new Date(supplier.createdAt).toLocaleString()}
        </div>
      </div>

      <Button asChild variant="ghost">
        <Link href="/dashboard/suppliers">Back to Suppliers</Link>
      </Button>
    </div>
  );
};

export default page;

