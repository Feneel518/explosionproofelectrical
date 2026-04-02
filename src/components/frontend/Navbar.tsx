import { Facebook, Instagram, Twitter } from "lucide-react";
import Image from "next/image";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import Link from "next/link";
import NavbarLinks from "./NavbarLinks";
import MobileNavigationBar from "./MobileNavigationBar";

const Navbar = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const showDashboardLink =
    session?.user.email === "info@explosionproofelectrical.com" ||
    session?.user.email === "feneelp@gmail.com";

  return (
    <>
      <div className="my-10 hidden h-24 items-center border-[0.5px] border-t-0 border-white lg:flex print:hidden!">
        <div className="p-2 border-r border-white flex items-center justify-center">
          <Image
            draggable={false}
            className=""
            src={"/asset/shortLogo.png"}
            height={80}
            width={80}
            alt="ExEC Logo"
          />
        </div>
        <div className="flex-1 flex flex-col h-full">
          <div className="border-b border-white flex  items-center justify-end flex-1">
            <div className="flex items-center gap-8 p-2 pr-8 text-sm font-thin">
              <span>GIDC, PHASE 4, VAPI</span>
              {showDashboardLink ? (
                <Link href={"/dashboard"}>Dashboard</Link>
              ) : (
                ""
              )}
            </div>
            <div className="border-l border-white h-full p-2 flex gap-4 items-center px-8">
              <Instagram className="font-thin stroke-1 " />
              <Facebook className="font-thin stroke-1 "></Facebook>
              <Twitter className="font-thin stroke-1 "></Twitter>
            </div>
          </div>
          <div className="flex-1 ">
            <NavbarLinks />
          </div>
        </div>
      </div>
      <MobileNavigationBar showDashboardLink={showDashboardLink} />
    </>
  );
};

export default Navbar;
