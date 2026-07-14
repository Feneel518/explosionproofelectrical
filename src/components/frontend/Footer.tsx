import Link from "next/link";
import { FC } from "react";

import Image from "next/image";
import { Facebook, Instagram, Twitter } from "lucide-react";

interface FooterProps {}

const Footer: FC<FooterProps> = ({}) => {
  return (
    <div className="mb-10 border-y border-white print:!hidden motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 md:mb-20">
      <div className="flex flex-col md:flex-row">
        <Link
          href="/"
          className="group flex flex-1  items-center justify-center border-b border-white p-4  md:flex-1 md:border-r md:border-b-0">
          <Image
            className=" object-contain transition-transform duration-300 group-hover:scale-105 "
            src={"/asset/fullLogo.png"}
            alt="ExEC Logo"
            width={250}
            height={80}
          />
        </Link>

        <div className="flex flex-col md:flex-1 md:flex-row">
          <div className="flex items-center justify-center border-b border-white px-4 py-4 md:flex-1 md:justify-end md:border-r md:border-b-0 md:pr-6">
            <div className="text-sm font-thin tracking-[0.22em] md:text-2xl">
              FOLLOW US
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 px-4 py-4 md:flex-1 md:gap-8">
            <Instagram
              size={36}
              className="font-thin stroke-1 transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:text-primary md:size-10"
            />
            <Facebook
              size={36}
              className="font-thin stroke-1 transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:text-primary md:size-10"
            />
            <Twitter
              size={36}
              className="font-thin stroke-1 transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:text-primary md:size-10"
            />
          </div>
        </div>
      </div>
      <div className="border-t border-white px-4 py-3 text-center text-xs text-white/80 md:text-sm">
        Plot No. 920, GIDC Phase 4, Vapi, Gujarat, India |{" "}
        <a className="underline underline-offset-4" href="mailto:info@explosionproofelectrical.com">
          info@explosionproofelectrical.com
        </a>
      </div>
    </div>
  );
};

export default Footer;
