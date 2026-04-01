import Image from "next/image";
import { FC } from "react";

interface DocumentHeaderProps {}

const DocumentHeader: FC<DocumentHeaderProps> = ({}) => {
  return (
    <div>
      <div className="bg-background w-full h-[50.4mm] flex items-center justify-center flex-col text-white ">
        <div className="">
          <Image
            draggable={false}
            src={"/asset/fullLogo.png"}
            alt="Explosion Proof Electrical Logo"
            width={300}
            height={100}></Image>
        </div>

        <div className="text-center text-xs">
          Plot no. 920, GIDC, phase 4 , vapi, Gujarat, India
        </div>
        <div className="text-center text-xs">24AAAFE7591G1ZG</div>
      </div>
      <div className="bg-primary h-2 w-full"></div>
    </div>
  );
};

export default DocumentHeader;
