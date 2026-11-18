import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import SupplierForm from "@/components/dashboard/supplier/SupplierForm";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  await requirePermission("master.write");
  return <SupplierForm mode="create" />;
};

export default page;
