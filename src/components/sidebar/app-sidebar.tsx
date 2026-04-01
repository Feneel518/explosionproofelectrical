"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Master",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Customers",
          url: "/dashboard/customers",
        },
        {
          title: "Suppliers",
          url: "/dashboard/suppliers",
        },
        {
          title: "Categories",
          url: "/dashboard/categories",
        },
        {
          title: "Products",
          url: "/dashboard/products",
        },
        {
          title: "Raw Materials",
          url: "/dashboard/raw-materials",
        },
      ],
    },
    {
      title: "Sales",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Quotation",
          url: "/dashboard/sales/quotations",
        },
        {
          title: "Delivery Challan",
          url: "/dashboard/sales/delivery-challans",
        },
        {
          title: "Sales Orders",
          url: "/dashboard/sales/orders",
        },
        {
          title: "Invoicing",
          url: "/dashboard/sales/invoices",
        },
      ],
    },
    {
      title: "Purchase",
      url: "#",
      icon: GalleryVerticalEnd,
      items: [
        {
          title: "GRN",
          url: "/dashboard/purchase/grn",
        },
      ],
    },
    {
      title: "Manufacturing",
      url: "#",
      icon: AudioWaveform,
      items: [
        {
          title: "Material Issues",
          url: "/dashboard/manufacturing/material-issues",
        },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      icon: Command,
      items: [
        {
          title: "Stock Summary",
          url: "/dashboard/inventory/stock",
        },
        {
          title: "Stock Movements",
          url: "/dashboard/inventory/movements",
        },
        {
          title: "Stock Adjustments",
          url: "/dashboard/inventory/adjustments",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <Link href={"/dashboard"}>
          {/* <TeamSwitcher teams={data.teams} /> */}
          <div className="relative h-20">
            <Image
              src={"/asset/fullLogo.png"}
              alt="Explosion Proof Electrical Control Logo"
              fill
              className="object-contain"></Image>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
