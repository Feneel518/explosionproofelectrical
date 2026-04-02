import Image from "next/image";
import { Bebas_Neue } from "next/font/google";
import { cn } from "@/lib/utils";

const bebas = Bebas_Neue({
  weight: ["400"],
  subsets: ["latin"],
});

export default function Mission() {
  return (
    <section className="relative  border-white ">
      <div className="flex flex-col lg:flex-row ">
        <div className="flex flex-1 items-center justify-center border-b border-white p-4 lg:border-r lg:border-b-0">
          <Image
            className="w-[260px] object-contain md:w-[360px]"
            src="/wellglass.png"
            alt="Explosion proof product"
            width={360}
            height={360}
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center border-b border-white px-4 py-6 text-center lg:border-r lg:border-b-0">
          <h3 className={cn("text-5xl md:text-6xl", bebas.className)}>
            OUR MISSION
          </h3>
          <div className="mx-auto mb-4 mt-2 h-1 w-12 rounded bg-white" />
          <p className="max-w-2xl text-sm font-thin leading-relaxed md:text-lg xl:text-xl">
            At Explosion Proof Electrical Control, our mission is to provide
            safe, certified, and durable flameproof solutions that protect
            people, facilities, and industrial operations. We focus on
            engineering quality, reliable delivery, and long-term customer
            trust.
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center p-4">
          <Image
            className="w-[210px] object-contain md:w-[300px]"
            src="/flame.png"
            alt="Flameproof safety"
            width={300}
            height={300}
          />
        </div>
      </div>
    </section>
  );
}
