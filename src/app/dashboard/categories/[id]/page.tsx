import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma/db";
import Link from "next/link";
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
    <div className=" space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {category?.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge>{category.status}</Badge>
            {category.deletedAt ? (
              <Badge variant="destructive">DELETED</Badge>
            ) : null}
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href={`/dashboard/categories/${category.id}/edit`}>Edit</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Description:</span>{" "}
          {category.description ?? "-"}
        </div>

        <div className="text-xs text-muted-foreground">
          Created: {new Date(category.createdAt).toLocaleString()}
        </div>
      </div>

      <Button asChild variant="ghost">
        <Link href="/dashboard/categories">← Back to Categories</Link>
      </Button>
    </div>
  );
};

export default page;
