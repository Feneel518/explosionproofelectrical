import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import CustomerForm from "@/components/dashboard/customer/CustomerForm";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  await requirePermission("master.write");
  return <CustomerForm mode="create" />;
};

export default page;
