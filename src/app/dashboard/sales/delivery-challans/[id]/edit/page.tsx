import DeliveryChallanFormNew from "@/components/dashboard/sales/delivery-challan/DeliveryChallanFormNew";
import { listCustomersForSelect } from "@/lib/actions/dashboard/global/listCustomersForSelect";
import { getDeliveryChallanDraftAction } from "@/lib/actions/dashboard/sales/delivery-challan/getDeliveryChallanDraftAction";
import { DeliveryChallanDraftData } from "@/lib/types/DeliveryChallanTypes";

import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;
  const res = await getDeliveryChallanDraftAction(id);

  if (!res.ok) redirect("/dashboard/sales/delivery-challans");

  const customers = await listCustomersForSelect();

  return (
    <div>
      <DeliveryChallanFormNew
        deliveryChallanId={res.deliveryChallanId}
        challanFY={res.challanFY}
        challanNo={res.challanNo}
        challanCode={res.challanCode}
        initialDraft={res.draft as DeliveryChallanDraftData}
        initialDraftVersion={res.draftVersion}
        customers={customers}
      />
    </div>
  );
};

export default page;
