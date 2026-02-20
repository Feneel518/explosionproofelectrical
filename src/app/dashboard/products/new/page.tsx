import ProductForm from "@/components/dashboard/product/ProductForm";
import { prisma } from "@/lib/prisma/db";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });
  return (
    <div>
      <ProductForm mode="create" categories={categories}></ProductForm>
    </div>
  );
};

export default page;
