import ProductForm from "@/components/dashboard/product/ProductForm";
import { prisma } from "@/lib/prisma/db";
import { redirect } from "next/navigation";
import { FC } from "react";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<pageProps> = async ({ params }) => {
  const { id } = await params;
  if (!id) {
    redirect("/dashboard/products");
  }

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      categoryId: true,
      slug: true,
      flpType: true,
      protection: true,
      gasGroup: true,
      material: true,
      finish: true,
      hardware: true,
      hsnCode: true,
      zones: true,
      status: true,
      shortDesc: true,
      longDesc: true,
    },
  });
  if (!product) {
    redirect("/dashboard/products");
  }

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <div>
      <ProductForm
        mode="edit"
        initial={{ ...product }}
        categories={categories}></ProductForm>
    </div>
  );
};

export default page;
