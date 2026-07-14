"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC } from "react";
import { cn } from "@/lib/utils";

interface NavbarLinksProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
  onNavigate?: () => void;
}

export const FRONTEND_NAV_LINKS = [
  { id: 1, name: "HOME", link: "/" },
  { id: 2, name: "GALLERY", link: "/gallery" },
  { id: 3, name: "CATALOG", link: "/catalog" },
  { id: 4, name: "OUR STORY", link: "/about-us" },
  { id: 5, name: "CONTACT", link: "/contact-us" },
];
const NavbarLinks: FC<NavbarLinksProps> = ({
  orientation = "horizontal",
  className,
  onNavigate,
}) => {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "font-light tracking-widest",
        isVertical
          ? "flex flex-col items-stretch justify-start"
          : "flex h-full items-center justify-around",
        className,
      )}>
      {FRONTEND_NAV_LINKS.map((link) => {
        const active = pathname === link.link;

        return (
          <Link
            href={`${link.link}`}
            onClick={onNavigate}
            className={cn(
              "text-sm transition-colors hover:text-primary",
              active ? "font-bold underline underline-offset-4" : "",
              isVertical ? "border-b border-white px-4 py-3 text-base" : "",
            )}
            key={link.id}>
            {link.name}
          </Link>
        );
      })}
    </div>
  );
};

export default NavbarLinks;
