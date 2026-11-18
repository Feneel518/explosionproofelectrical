import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import WorkerForm from "@/components/dashboard/contractors/WorkerForm";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  await requirePermission("accounts.write");
  return (
    <div>
      <WorkerForm mode="create" />
    </div>
  );
};

export default page;
