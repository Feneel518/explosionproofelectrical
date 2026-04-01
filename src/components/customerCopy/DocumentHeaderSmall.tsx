import Image from "next/image";
import { FC } from "react";

interface DocumentHeaderSmallProps {}

const DocumentHeaderSmall: FC<DocumentHeaderSmallProps> = ({}) => {
  return (
    <div>
      <div className="bg-background w-full h-[25.4mm] flex items-center justify-center flex-col text-white ">
        <div className="">
          <Image
            draggable={false}
            src={"/asset/fullLogo.png"}
            alt="Explosion Proof Electrical Logo"
            width={200}
            height={75}></Image>
        </div>
      </div>
      <div className="bg-primary h-2 w-full"></div>
    </div>
  );
};

export default DocumentHeaderSmall;
