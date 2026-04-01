import { FC } from "react";
import DocumentFooter from "../DocumentFooter";

interface DeliveryChallanFooterProps {
  pageIndex: number;
  totalLength: number;
}

const DeliveryChallanFooter: FC<DeliveryChallanFooterProps> = ({
  pageIndex,
  totalLength,
}) => {
  return (
    <div>
      <div className="m-4 border-t w-fit ml-auto text-right  ">
        For Explosion Proof Electrical Control
      </div>
      <DocumentFooter
        pageIndex={pageIndex}
        totalLength={totalLength}></DocumentFooter>
    </div>
  );
};

export default DeliveryChallanFooter;
