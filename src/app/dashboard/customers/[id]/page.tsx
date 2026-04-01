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

  const customer = await prisma.customer.findUnique({
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

  if (!customer)
    return (
      <div className="text-sm text-muted-foreground">Customer not found.</div>
    );
  return (
    <div className=" space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {customer.companyName}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge>{customer.status}</Badge>
            {customer.deletedAt ? (
              <Badge variant="destructive">DELETED</Badge>
            ) : null}
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href={`/dashboard/customers/${customer.id}/edit`}>Edit</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Email:</span>{" "}
          {customer.companyEmail ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Phone:</span>{" "}
          {customer.companyPhone ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">GSTIN:</span>{" "}
          {customer.gstin ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Address:</span>{" "}
          {customer.addressLine1}
          {customer.addressLine2 ? `, ${customer.addressLine2}` : ""},{" "}
          {customer.city}, {customer.state}, {customer.country} -{" "}
          {customer.pincode}
        </div>
        <div className="text-xs text-muted-foreground">
          Created: {new Date(customer.createdAt).toLocaleString()}
        </div>
      </div>

      <Button asChild variant="ghost">
        <Link href="/dashboard/customers">← Back to Customers</Link>
      </Button>
    </div>
  );
};

export default page;
