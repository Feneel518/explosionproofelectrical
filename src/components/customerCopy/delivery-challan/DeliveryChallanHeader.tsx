import { buildAddressLines } from "@/lib/helpers/globalHelpers/cleanAddress";
import { Customer, DeliveryChallanType } from "@prisma/client";
import { FC } from "react";
import DocumentHeader from "../DocumentHeader";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface DeliveryChallanHeaderProps {
  customerDetails: Partial<Customer> & {
    clientName?: string;
    challanNumber: string;
    challanFy: string;
    type: DeliveryChallanType;
  };
}

const DeliveryChallanHeader: FC<DeliveryChallanHeaderProps> = ({
  customerDetails,
}) => {
  const addressLines = buildAddressLines(customerDetails);
  return (
    <div>
      <DocumentHeader></DocumentHeader>
      <div
        className={`w-full p-4   flex justify-between border-b border-muted-foreground`}>
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-lg">{customerDetails.companyName}</h2>

          <div className="">
            <div className="text-sm leading-normal text-gray-700">
              {addressLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col justify-between">
          <h1 className="text-3xl uppercase tracking-tighter">
            Delivery Challan
          </h1>
          <div className="">
            <h3>
              ExDC-{customerDetails.challanFy}-
              {customerDetails.challanNumber}{" "}
            </h3>
            <h3>{format(customerDetails.createdAt as Date, "PPP")}</h3>
            <Badge className="mt-2">{customerDetails.type}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryChallanHeader;
