import { FC } from "react";

interface DocumentFooterProps {
  pageIndex: number;
  totalLength: number;
}

const DocumentFooter: FC<DocumentFooterProps> = ({
  pageIndex,
  totalLength,
}) => {
  return (
    <div className="w-full bg-background h-8 px-8 flex items-center text-white text-xs justify-between">
      <div className="">info@explosionproofelectrical.com</div>
      <div className="">
        {pageIndex} of {totalLength}
      </div>
    </div>
  );
};

export default DocumentFooter;
