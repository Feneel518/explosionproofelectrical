"use client";

import Image from "next/image";

import Link from "next/link";
import { Facebook, Instagram, Menu, Twitter, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import NavbarLinks from "./NavbarLinks";

type Props = {
  showDashboardLink: boolean;
};

export default function MobileNavigationBar({ showDashboardLink }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="my-4 border border-t-0 border-white lg:hidden print:hidden">
      <div className="flex h-20 items-center justify-between px-3">
        <Link href="/" className="flex items-center">
          <Image
            src={"/asset/shortLogo.png"}
            height={56}
            width={56}
            alt="ExEC Logo"
          />
        </Link>

        <h1 className="mx-2 line-clamp-2 text-center text-xs tracking-wider sm:text-sm">
          Explosion Proof Electrical Control
        </h1>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-md border border-white p-2">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}>
        <div className="overflow-hidden">
          <div className="border-t border-white">
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs font-light tracking-wider">
              <span>GIDC, PHASE 4, VAPI</span>
              {showDashboardLink ? (
                <Link
                  href="/dashboard"
                  className="text-sm underline underline-offset-4">
                  Dashboard
                </Link>
              ) : null}
            </div>

            <NavbarLinks
              orientation="vertical"
              onNavigate={() => setOpen(false)}
              className="border-t border-white"
            />

            <div className="flex items-center justify-center gap-5 px-4 py-4">
              <Instagram className="stroke-1" />
              <Facebook className="stroke-1" />
              <Twitter className="stroke-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
