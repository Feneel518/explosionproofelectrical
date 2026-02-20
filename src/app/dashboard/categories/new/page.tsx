import CategoryForm from "@/components/dashboard/category/CategoryForm";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  return (
    <div>
      <CategoryForm mode="create"></CategoryForm>
    </div>
  );
};

export default page;
