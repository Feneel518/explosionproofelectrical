import Image from "next/image";
import { Bebas_Neue } from "next/font/google";
import { cn } from "@/lib/utils";

const bebas = Bebas_Neue({
  weight: ["400"],
  subsets: ["latin"],
});

export default function Banner() {
  return (
    <section className="relative mt-10 md:mt-20">
      <p className={cn("text-4xl md:text-7xl", bebas.className)}>WELCOME TO</p>
      <h1 className={cn("text-5xl md:text-7xl", bebas.className)}>
        Explosion Proof Electrical Control
      </h1>

      <div className="mt-8 h-1 w-24 border-grow-x md:mt-14" />

      <div className="absolute left-1/2 top-[182px] z-20 flex h-10 -translate-x-1/2 items-center border-x border-white bg-background px-4 text-sm tracking-wider max-md:top-[146px] max-sm:top-[198px] lg:top-[318px] xl:top-[244px]">
        SCROLL DOWN
      </div>

      <div className="mt-10 flex flex-col border-y border-white md:mt-14 lg:flex-row">
        <div className="flex flex-1 items-center justify-center border-b border-white p-4 lg:border-r lg:border-b-0">
          <Image
            className="w-[500px] object-contain max-lg:w-[300px]"
            src="/wellglass.png"
            draggable={false}
            alt="Wellglass"
            width={500}
            height={500}
            priority
          />
        </div>

        <div className="flex flex-1 flex-col border-b border-white px-3 py-5 lg:border-r lg:border-b-0">
          <h2 className={cn("mt-2 text-center text-4xl md:mt-6", bebas.className)}>
            ABOUT US
          </h2>
          <div className="mx-auto mb-4 mt-2 h-1 w-12 rounded bg-white" />
          <p className="text-center text-sm font-thin md:mt-6 md:text-lg">
            Explosion Proof Electrical Control is a leading provider of flameproof and
            explosion-proof solutions for a wide range of industries. Our team is
            dedicated to helping customers maintain a safe and compliant work
            environment with top-quality products and service.
          </p>
          <p className="mt-4 hidden text-center text-sm font-thin md:block md:text-lg">
            Founded in 1996, we have built a reputation for excellence through
            innovation, reliability, and customer-first support. Our manufacturing
            setup enables durable, high-performance products for hazardous
            environments.
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full flex-row lg:flex-col">
            <div className="flex flex-1 items-center justify-center border-r border-white p-4 lg:border-r-0 lg:border-b">
              <Image
                className="w-[180px] object-contain lg:w-[280px]"
                src="/flame.png"
                width={280}
                height={280}
                alt="Flameproof Graphic"
              />
            </div>
            <div className="flex flex-1 items-center justify-center p-4">
              <Image
                className="w-[140px] object-contain lg:w-[220px]"
                src="/sketchfl.png"
                alt="Sketch"
                width={220}
                height={150}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
