import Banner from "@/lib/actions/frontend/Banner";
import MagneticLightEffect from "@/lib/actions/frontend/MagneticLightEffect";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-2xl:mx-4">
      <Banner></Banner>
      {/* <MagneticLightEffect /> */}
    </div>
  );
}
