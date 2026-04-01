import { FC } from "react";
import DocumentHeader from "../DocumentHeader";
import { Customer } from "@prisma/client";
import { format } from "date-fns";
import { buildAddressLines } from "@/lib/helpers/globalHelpers/cleanAddress";

interface QuotationHeaderProps {
  customerDetails: Partial<Customer> & {
    clientName?: string;
    quotationNumber: string;
    quoteFy: string;
  };
}

const QuotationHeader: FC<QuotationHeaderProps> = ({ customerDetails }) => {
  const addressLines = buildAddressLines(customerDetails);
  return (
    <div>
      <DocumentHeader></DocumentHeader>
      <div
        className={`w-full p-4   flex justify-between border-b border-muted-foreground`}>
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-lg">{customerDetails.companyName}</h2>

          <div className="">
            <h4>To {customerDetails.clientName},</h4>
            <div className="text-xs leading-normal text-gray-700">
              {addressLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col justify-between">
          <h1 className="text-3xl uppercase tracking-tighter">Quotation</h1>
          <div className="">
            <h3>
              ExQn-{customerDetails.quoteFy}-
              {customerDetails.quotationNumber}{" "}
            </h3>
            <h3>{format(customerDetails.createdAt as Date, "PPP")}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationHeader;
