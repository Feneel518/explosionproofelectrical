import QuotationCustomerCopy from "@/components/customerCopy/quotation/QuotationCustomerCopy";
import { getQuotationByIdAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationByIdAction";
import { requireAuth } from "@/lib/check/requireAuth";

import { Lora } from "next/font/google";
import { redirect } from "next/navigation";
import { FC } from "react";

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

  const quotationData = await getQuotationByIdAction(id);

  if (!quotationData.ok) {
    redirect("/dashboard/sales/quotations");
  }

  const quotation = quotationData.quotation;

  return (
    <div
      className={` ${lora.className} flex flex-col items-center justify-center gap-4 print:gap-0 my-20 print:my-0`}>
      <QuotationCustomerCopy quotation={quotation}></QuotationCustomerCopy>
    </div>
  );
};

export default page;
