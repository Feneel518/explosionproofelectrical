import { FC } from "react";
import DocumentHeader from "../DocumentHeader";
import { Customer } from "@prisma/client";
import { format } from "date-fns";
import { buildAddressLines } from "@/lib/helpers/globalHelpers/cleanAddress";

interface WorkOrderHeaderProps {
  customerDetails: Partial<Customer> & {
    clientName?: string;
    orderNumber: string;
    orderFy: string;
  };
}

const WorkOrderHeader: FC<WorkOrderHeaderProps> = ({ customerDetails }) => {
  const addressLines = buildAddressLines(customerDetails);
  return (
    <div>
      <DocumentHeader></DocumentHeader>
      <div
        className={`w-full p-4   flex justify-between border-b border-muted-foreground`}>
        <div className="flex flex-col gap-2">
          <div className="">
            <h4 className="text-2xl">{customerDetails.clientName}</h4>
            <h4 className="">Today Date: {format(new Date(), "PPP")}</h4>
          </div>
        </div>

        <div className="text-right flex flex-col justify-between">
          <h1 className="text-3xl uppercase tracking-tighter">Work Order</h1>
          <div className="">
            <h3>
              ExWO-{customerDetails.orderFy}-{customerDetails.orderNumber}{" "}
            </h3>
            <h3>{format(customerDetails.createdAt as Date, "PPP")}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderHeader;
