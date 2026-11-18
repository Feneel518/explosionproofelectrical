import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import CategoryForm from "@/components/dashboard/category/CategoryForm";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  await requirePermission("master.write");
  return (
    <div>
      <CategoryForm mode="create"></CategoryForm>
    </div>
  );
};

export default page;
