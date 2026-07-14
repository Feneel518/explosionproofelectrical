import SupplierForm from "@/components/dashboard/supplier/SupplierForm";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  return <SupplierForm mode="create" />;
};

export default page;
