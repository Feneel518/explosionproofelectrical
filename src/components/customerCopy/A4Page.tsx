import { FC } from "react";

import { cn } from "@/lib/utils";
import FitContent from "./FitContent";
import Image from "next/image";

interface A4PageProps {
  table: React.ReactNode;
  heading: React.ReactNode;
  footer: React.ReactNode;
  onResize: () => void;
  additionalNotes?: string;
  className?: React.ReactNode;
}

const A4Page: FC<A4PageProps> = ({
  table,
  heading,
  footer,
  onResize,
  additionalNotes,
  className,
}) => {
  // w-[210mm] h-[297mm]
  return (
    <div
      data-a4-page
      className={cn(
        " w-screen  max-w-[210mm] min-h-[297mm] mx-4 print:mx-0 print:size-[A4] bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col  ",
        className,
      )}>
      <div className="">{heading}</div>
      <div className="flex-1 relative p-4">
        <div className="absolute size-80 opacity-5 left-1/2 top-1/2 -translate-1/2">
          <Image alt="EXEC Logo" src={"/asset/shortLogo.png"} fill></Image>
        </div>
        <FitContent onResize={onResize}>{table}</FitContent>
        {additionalNotes && (
          <div className="font-bold">Notes: {additionalNotes}</div>
        )}
      </div>
      <div className="">{footer}</div>
    </div>
  );
};

export default A4Page;
