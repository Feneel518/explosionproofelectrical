import CategoryForm from "@/components/dashboard/category/CategoryForm";
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
    redirect("/dashboard/categories");
  }

  const category = await prisma.category.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });
  if (!category) {
    redirect("/dashboard/categories");
  }
  return (
    <div>
      <CategoryForm
        mode="edit"
        initial={{
          description: category.description,
          id: category.id,
          name: category.name,
          slug: category.status,
          status: category.status,
        }}></CategoryForm>
    </div>
  );
};

export default page;
