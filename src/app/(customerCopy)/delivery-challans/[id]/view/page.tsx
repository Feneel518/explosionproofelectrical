import DeliveryChallanCustomerCopy from "@/components/customerCopy/delivery-challan/DeliveryChallanCustomerCopy";
import { getDeliveryChallanByIdAction } from "@/lib/actions/dashboard/sales/delivery-challan/getDeliveryChallanByIdAction";
import { requireAuth } from "@/lib/check/requireAuth";
import { Lora } from "next/font/google";
import { redirect } from "next/navigation";
import { FC } from "react";
import { toast } from "sonner";

interface pageProps {
  params: Promise<{ id: string }>;
}

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const page: FC<pageProps> = async ({ params }) => {
  await requireAuth();
  const { id } = await params;

  const challanData = await getDeliveryChallanByIdAction(id);

  if (!challanData.ok) {
    toast.error(challanData.message);

    redirect("/dashboard/sales/delivery-challans");
  }

  const challan = challanData.deliveryChallan;

  return (
    <div
      className={` ${lora.className} flex flex-col items-center justify-center gap-4 print:gap-0 my-20 print:my-0`}>
      {/* <QuotationCustomerCopy quotation={quotation}></QuotationCustomerCopy> */}
      <DeliveryChallanCustomerCopy
        challan={challan}></DeliveryChallanCustomerCopy>
    </div>
  );
};

export default page;
