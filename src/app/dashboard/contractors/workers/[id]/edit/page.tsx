import WorkerForm from "@/components/dashboard/contractors/WorkerForm";
import { prisma } from "@/lib/prisma/db";
import { notFound } from "next/navigation";
import { FC } from "react";

interface pageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<pageProps> = async ({ params }) => {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const worker = await prisma.worker.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      address: true,
      joinedAt: true,
      notes: true,
      status: true,
    },
  });

  if (!worker) {
    notFound();
  }

  const joinedAtStr = worker.joinedAt
    ? worker.joinedAt.toISOString().slice(0, 10)
    : "";

  return (
    <div>
      <WorkerForm
        mode="edit"
        initial={{
          id: worker.id,
          code: worker.code,
          name: worker.name,
          role: worker.role,
          phone: worker.phone,
          email: worker.email,
          address: worker.address,
          joinedAt: joinedAtStr,
          notes: worker.notes,
          status: worker.status,
        }}
      />
    </div>
  );
};

export default page;
