import CustomerForm from "@/components/dashboard/customer/CustomerForm";
import { prisma } from "@/lib/prisma/db";
import { FC } from "react";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<pageProps> = async ({ params }) => {
  const { id } = await params;
  const c = await prisma.customer.findUnique({
    where: { id },
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
    },
  });

  if (!c)
    return (
      <div className="text-sm text-muted-foreground">Customer not found.</div>
    );

  return (
    <div className=" space-y-6">
      <CustomerForm
        mode="edit"
        customerId={c.id}
        initial={{
          companyName: c.companyName,
          companyEmail: c.companyEmail as string | undefined,
          companyPhone: c.companyPhone as string | undefined,
          addressLine1: c.addressLine1,
          addressLine2: c.addressLine2 as string | undefined,
          city: c.city,
          state: c.state,
          country: c.country,
          pincode: c.pincode,
          gstin: c.gstin as string | undefined,
          status: c.status,
          id: c.id,
        }}
      />
    </div>
  );
};

export default page;
