"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
// import * as React from "react";
// import Image from "next/image";
// import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
// import {
//   BadgeCheck,
//   Factory,
//   ShieldCheck,
//   Sparkles,
//   Truck,
// } from "lucide-react";
// import {
//   Carousel,
//   CarouselApi,
//   CarouselContent,
//   CarouselItem,
//   CarouselNext,
//   CarouselPrevious,
// } from "@/components/ui/carousel";
// import { Card, CardContent } from "@/components/ui/card";
// import { cn } from "@/lib/utils";

export type FeaturedProduct = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

// type Props = {
//   products: FeaturedProduct[];
// };

const bebas = Bebas_Neue({
  weight: ["400"],
  subsets: ["latin"],
});

// const reasons = [
//   {
//     title: "Expertise",
//     text: "Decades of flameproof manufacturing experience with practical engineering guidance.",
//     icon: ShieldCheck,
//   },
//   {
//     title: "Quality",
//     text: "High-grade materials, precision workmanship, and strict quality checks.",
//     icon: BadgeCheck,
//   },
//   {
//     title: "Fast Delivery",
//     text: "Production planning built for urgent industrial timelines and repeat orders.",
//     icon: Truck,
//   },
//   {
//     title: "Innovation",
//     text: "Continuous product refinement for reliability in hazardous environments.",
//     icon: Sparkles,
//   },
// ];

// export default function FeaturedProducts({ products }: Props) {
//   const [api, setApi] = React.useState<CarouselApi>();

//   React.useEffect(() => {
//     if (!api) return;

//     const timer = window.setInterval(() => {
//       if (api.canScrollNext()) {
//         api.scrollNext();
//       } else {
//         api.scrollTo(0);
//       }
//     }, 4500);

//     return () => window.clearInterval(timer);
//   }, [api]);

//   return (
//     <section className="relative mt-14 md:mt-24">
//       <h2 className={cn("text-center text-5xl md:text-7xl", bebas.className)}>
//         GETTING IT RIGHT SINCE 1996
//       </h2>
//       <div className="mx-auto mt-3 h-1 w-28 border-grow-x" />

//       <div className="mt-10 flex flex-col border-y border-white lg:mt-16 lg:flex-row ">
//         <div className="flex flex-1 flex-col border-b border-white px-3 py-6 lg:border-r lg:border-b-0 lg:px-4 w-1/2">
//           <h3 className={cn("text-center text-4xl", bebas.className)}>
//             FEATURED PRODUCTS
//           </h3>
//           <div className="mx-auto mb-4 mt-2 h-1 w-12 rounded bg-white" />

//           <div className="relative mx-auto  pb-2 pt-4 ">
//             <Carousel
//               setApi={setApi}
//               opts={{ align: "start", loop: true }}
//               className="">
//               <CarouselContent>
//                 {products.map((product) => (
//                   <CarouselItem key={product.id} className=" xl:basis-1/1">
//                     {products.map((product) => (
//                       <Card className="h-full  bg-transparent text-white ">
//                         <CardContent className="flex h-full flex-col p-4">
//                           <div className="relative mb-4 aspect-4/3 w-full overflow-hidden ">
//                             <Image
//                               src={product.imageUrl}
//                               alt={product.name}
//                               fill
//                               className="object-contain p-3"
//                             />
//                           </div>
//                           <h4 className="line-clamp-2 text-base tracking-wide">
//                             {product.name}
//                           </h4>
//                           <p className="mt-2 line-clamp-3 text-sm font-thin text-white/80">
//                             {product.description}
//                           </p>
//                           <Link
//                             href="#newsletter"
//                             className="mt-4 inline-flex w-fit border-b border-white pb-0.5 text-sm tracking-wider transition-all hover:text-primary">
//                             ENQUIRE NOW
//                           </Link>
//                         </CardContent>
//                       </Card>
//                     ))}
//                   </CarouselItem>
//                 ))}
//               </CarouselContent>
//             </Carousel>
//             {/* <Carousel
//               setApi={setApi}
//               opts={{ align: "start", loop: true }}
//               className="">
//               <CarouselContent>
//                 {products.map((product) => (
//                   <CarouselItem key={product.id} className=" xl:basis-1/1">
//                     <Card className="h-full  bg-transparent text-white ">
//                       <CardContent className="flex h-full flex-col p-4">
//                         <div className="relative mb-4 aspect-4/3 w-full overflow-hidden ">
//                           <Image
//                             src={product.imageUrl}
//                             alt={product.name}
//                             fill
//                             className="object-contain p-3"
//                           />
//                         </div>
//                         <h4 className="line-clamp-2 text-base tracking-wide">
//                           {product.name}
//                         </h4>
//                         <p className="mt-2 line-clamp-3 text-sm font-thin text-white/80">
//                           {product.description}
//                         </p>
//                         <Link
//                           href="#newsletter"
//                           className="mt-4 inline-flex w-fit border-b border-white pb-0.5 text-sm tracking-wider transition-all hover:text-primary">
//                           ENQUIRE NOW
//                         </Link>
//                       </CardContent>
//                     </Card>
//                   </CarouselItem>
//                 ))}
//               </CarouselContent>
//               <CarouselPrevious className="-l-3" />
//               <CarouselNext className="-right-3" />
//             </Carousel> */}
//           </div>
//         </div>

//         <div className="flex flex-1 flex-col">
//           <div className="flex items-center justify-center gap-3 border-b border-white px-4 py-5">
//             <Factory className="h-6 w-6" />
//             <span className={cn("text-3xl tracking-[0.2em]", bebas.className)}>
//               CIMFR CERTIFIED
//             </span>
//           </div>

//           <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
//             {reasons.map((reason, index) => {
//               const Icon = reason.icon;
//               return (
//                 <div
//                   key={reason.title}
//                   className={cn(
//                     "border-white p-4",
//                     index % 2 === 0 ? "md:border-r" : "",
//                     index < 2 ? "border-b" : "",
//                   )}>
//                   <div className="mb-2 flex items-center gap-2">
//                     <Icon className="h-4 w-4" />
//                     <h5 className="text-sm tracking-wider">{reason.title}</h5>
//                   </div>
//                   <p className="text-sm font-thin text-white/80">
//                     {reason.text}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

import Image from "next/image";
import React, { FC } from "react";
import ProductEnquiryDialog from "./ProductEnquiryDialog";

interface FeaturedProductsProps {
  products: FeaturedProduct[];
}

const FeaturedProducts: FC<FeaturedProductsProps> = ({ products }) => {
  // const products = await getRandomProducts();

  const [api, setApi] = React.useState<CarouselApi>();

  React.useEffect(() => {
    if (!api) return;

    const timer = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 4500);

    return () => window.clearInterval(timer);
  }, [api]);

  return (
    <div className="mt-2 md:mt-24 relative ">
      <h2
        className={`${bebas.className} text-7xl max-md:text-5xl text-center my-10 `}>
        GETTING IT RIGHT SINCE 1996
      </h2>
      {/* sectio */}
      <div className=" flex  md:mt-24 border-white border-b border-t mb-10 max-lg:flex-col">
        <div className=" flex-1 ">
          <h3
            className={`${bebas.className} text-center mt-6 md:mt-10 text-4xl`}>
            FEATURED PRODUCTS
          </h3>
          <div className="h-1 w-12 bg-white rounded-lg relative left-2/4 -translate-x-2/4 mt-2 mb-4"></div>
          <div className="flex items-center justify-center max-lg:border-white max-lg:border-b ">
            <Carousel
              setApi={setApi}
              opts={{ align: "start", loop: true }}
              className="">
              <CarouselContent>
                {products.map((product) => (
                  <CarouselItem key={product.id} className="basis-full w-20">
                    <Card className="h-full  bg-transparent border-none text-white w-full">
                      <CardContent className="flex h-full flex-col p-4 items-center">
                        <div className="relative mb-4 aspect-4/3 w-full overflow-hidden ">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-contain p-3"
                          />
                        </div>
                        <h4 className="line-clamp-2 text-base tracking-wide">
                          {product.name}
                        </h4>
                        <p className="mt-2 line-clamp-3 text-sm font-thin text-white/80">
                          {product.description}
                        </p>
                        <ProductEnquiryDialog productName={product.name} />
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="">
                <CarouselPrevious className="-mt-16" />
                <CarouselNext className="-mt-16" />
              </div>
            </Carousel>
          </div>
        </div>
        <div className=" flex-1 border-white border-l text-sm flex flex-col ">
          <div className=" flex-1 flex border-white border-b">
            <div
              className={` ${bebas.className} flex-1 flex flex-col border-white border-none `}>
              <div
                className={` flex flex-col flex-1 items-center justify-center border-white border-b`}>
                <p className="text-2xl tracking-[4px] relative top-4 max-lg:top-3 lg:text-4xl">
                  IT'S A
                </p>
                <Image
                  className="max-lg:w-[200px]"
                  src={"/asset/arrow.png"}
                  alt=""
                  width={200}
                  height={200}
                />
                <p className="text-2xl tracking-[4px] relative bottom-2 lg:text-4xl">
                  THING
                </p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center max-sm:mt-4">
                <h4 className="text-6xl">CIMFR / PESO</h4>
                <h4 className=" tracking-[20px] text-2xl left-2.5  relative -top-3">
                  CERTIFIED
                </h4>
              </div>
            </div>
            <div className=" flex-1 flex items-center justify-center border-white border-l">
              <Image
                className="max-lg:w-[300px]"
                src={"/asset/gujarat.png"}
                alt=""
                width={300}
                height={300}
              />
            </div>
          </div>
          <div className="flex-1 p-4 flex flex-col space-y-4 lg:space-y-4 mt-4">
            <h3 className={` ${bebas.className} text-3xl`}>WHY CHOOSE US?</h3>
            <p className="text-xs  font-thin lg:text-lg">
              <span className="font-bold">Expertise:</span> Our team has years
              of experience in the flameproof and explosion-proof industry, and
              we have the knowledge and expertise to provide the best solutions
              for your needs.
            </p>
            <p className="text-xs font-thin lg:text-lg">
              <span className="font-bold">Quality:</span> We use advanced
              manufacturing techniques and the highest-quality materials to
              produce reliable, long-lasting products.
            </p>
            <p className="text-xs font-thin lg:text-lg">
              <span className="font-bold">Safety:</span> Safety is our top
              priority, and we go above and beyond to ensure that our products
              meet the highest industry standards and regulations.
            </p>
            <p className="text-xs font-thin lg:text-lg">
              <span className="font-bold">Fast delivery</span> is another reason
              why you should choose us. We understand that timely delivery is
              important to our customers, and we do everything we can to get
              your orders to you as quickly as possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
