import { createDraftQuotationAction } from "@/lib/actions/dashboard/sales/quotation/createDraftQuotationAction";
import { redirect } from "next/navigation";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  const res = await createDraftQuotationAction();

  if (!res.ok) redirect("/dashboard/sales/quotations");
  redirect(`/dashboard/sales/quotations/${res.id}/edit`);
};

export default page;
