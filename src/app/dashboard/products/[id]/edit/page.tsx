import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import ProductForm from "@/components/dashboard/product/ProductForm";
import { prisma } from "@/lib/prisma/db";
import { redirect } from "next/navigation";
import { FC } from "react";
import { catalogProductName } from "@/lib/products/catalogNames";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<pageProps> = async ({ params }) => {
  await requirePermission("master.write");
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
      displayName: true,
      categoryId: true,
      slug: true,
      flpType: true,
      protection: true,
      gasGroup: true,
      certificationMarking: true,
      certificationReference: true,
      certificationVerifiedAt: true,
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
        initial={{ ...product, name: catalogProductName(product), certificationVerified: Boolean(product.certificationVerifiedAt) }}
        categories={categories}></ProductForm>
    </div>
  );
};

export default page;
