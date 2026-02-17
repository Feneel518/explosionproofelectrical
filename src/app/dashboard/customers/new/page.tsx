import CustomerForm from "@/components/dashboard/customer/CustomerForm";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  return <CustomerForm mode="create" />;
};

export default page;
