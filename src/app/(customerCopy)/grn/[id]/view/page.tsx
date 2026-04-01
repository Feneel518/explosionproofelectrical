import GrnCustomerCopy from "@/components/customerCopy/grn/GrnCustomerCopy";
import { getGrnByIdAction } from "@/lib/actions/dashboard/purchase/grn/getGrnByIdAction";
import { requireAuth } from "@/lib/check/requireAuth";
import { Lora } from "next/font/google";
import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const Page: FC<PageProps> = async ({ params }) => {
  await requireAuth();
  const { id } = await params;

  const grnData = await getGrnByIdAction(id);
  if (!grnData.ok) {
    redirect("/dashboard/purchase/grn");
  }

  return (
    <div
      className={`${lora.className} flex flex-col items-center justify-center gap-4 print:gap-0 my-20 print:my-0`}>
      <GrnCustomerCopy grn={grnData.grn as any} />
    </div>
  );
};

export default Page;
