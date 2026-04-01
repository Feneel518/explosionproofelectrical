"use client";

import Image from "next/image";
import { FC } from "react";
import { Bebas_Neue } from "next/font/google";

interface BannerProps {}

const bebas = Bebas_Neue({
  weight: ["400"],
  subsets: ["latin"],
});

const Banner: FC<BannerProps> = () => {
  return (
    <div className="mt-10 flex border-l-0 border-r-0 border-color md:mt-14 max-lg:flex-col max-md:items-center">
      <div className="relative my-8 flex flex-1 items-center justify-center border-right border-color max-lg:border-r-0">
        <div
          data-light-wrapper
          data-light-active="false"
          className="banner-light-wrapper relative aspect-square w-[500px] max-lg:w-[300px]">
          <Image
            src="/wellglass.png"
            alt="Wellglass light"
            fill
            priority
            draggable={false}
            className="pointer-events-none select-none object-contain wellglass-image"
          />

          {/* This is the exact area where the magnetic glow will snap */}
          <div
            data-light="true"
            aria-hidden="true"
            className="absolute left-[50%] top-[50%] z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
          />

          {/* This is the visible turned-on glow */}
          <div
            aria-hidden="true"
            className="light-bloom absolute left-[75%] top-[90%] h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full"
          />

          {/* Optional small bulb core glow */}
          <div
            aria-hidden="true"
            className="light-core absolute left-[52%] top-[70%] h-16 w-16  rounded-full"
          />
        </div>
      </div>

      <style jsx>{`
        .banner-light-wrapper .wellglass-image {
          transition:
            filter 300ms ease,
            transform 300ms ease;
          filter: drop-shadow(0 0 0 rgba(255, 210, 120, 0));
        }

        .banner-light-wrapper .light-bloom {
          pointer-events: none;
          opacity: 0;
          transition:
            opacity 300ms ease,
            transform 300ms ease,
            filter 300ms ease;
         background: radial-gradient(
  circle,
  rgba(255,255,255,0.95) 0%,
  rgba(210,230,255,0.6) 40%,
  rgba(190,220,255,0.25) 65%,
  transparent 80%
);
          filter: blur(28px);
          transform: translate(-50%, -50%) scale(0.8);
        }

        .banner-light-wrapper .light-core {
          pointer-events: none;
          opacity: 0;
          transition:
            opacity 300ms ease,
            box-shadow 300ms ease,
            transform 300ms ease;
          background: background: rgba(255,255,255,0.95);
          filter: blur(6px);
          transform: translate(-50%, -50%) scale(0.9);
        }

        .banner-light-wrapper[data-light-active="true"] .wellglass-image {
          filter: drop-shadow(0 0 10px rgba(255, 215, 120, 0.3))
            drop-shadow(0 0 22px rgba(255, 195, 95, 0.24));
          transform: scale(1.01);
        }

        .banner-light-wrapper[data-light-active="true"] .light-bloom {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.12);
          filter: blur(34px);
        }

        .banner-light-wrapper[data-light-active="true"] .light-core {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
         box-shadow:
  0 0 30px rgba(255,255,255,0.9),
  0 0 70px rgba(210,230,255,0.7),
  0 0 120px rgba(190,220,255,0.45);
        }
      `}</style>
    </div>
  );
};

export default Banner;
