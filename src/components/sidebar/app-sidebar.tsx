"use client";

import * as React from "react";
import {
  AudioWaveform,
  Bot,
  ChartColumnIncreasing,
  Command,
  GalleryVerticalEnd,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";

export type AppSidebarUser = {
  name: string;
  email: string;
  avatar?: string | null;
  role?: string | null;
};

const data = {
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
        {
          title: "Inventory Employees",
          url: "/dashboard/inventory/employees",
        },
        {
          title: "Casting Masters",
          url: "/dashboard/casting-masters",
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
          title: "Pending Orders",
          url: "/dashboard/sales/pending",
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
          title: "Purchase Orders",
          url: "/dashboard/purchase/orders",
        },
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
        {
          title: "BOM",
          url: "/dashboard/manufacturing/bom",
        },
        {
          title: "Serial Numbers",
          url: "/dashboard/serial",
        },
        {
          title: "Casting Jobs",
          url: "/dashboard/manufacturing/casting-jobs",
        },
        {
          title: "Worker Ledger",
          url: "/dashboard/manufacturing/worker-ledger",
        },
        {
          title: "Production Planning",
          url: "/dashboard/manufacturing/planning",
        },
      ],
    },
    {
      title: "Contractors",
      url: "#",
      icon: AudioWaveform,
      items: [
        {
          title: "Workers",
          url: "/dashboard/contractors/workers",
        },
        {
          title: "Rate Catalog",
          url: "/dashboard/contractors/rate-catalog",
        },
        {
          title: "Daily Entries",
          url: "/dashboard/contractors/entries",
        },
        {
          title: "Monthly Payouts",
          url: "/dashboard/contractors/payouts",
        },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      icon: Command,
      items: [
        {
          title: "Go-Live Setup",
          url: "/dashboard/inventory/go-live",
        },
        {
          title: "Stock Summary",
          url: "/dashboard/inventory/stock",
        },
        {
          title: "Stock Movements",
          url: "/dashboard/inventory/movements",
        },
        {
          title: "Material Returns",
          url: "/dashboard/inventory/returns",
        },
        {
          title: "Stock Adjustments",
          url: "/dashboard/inventory/adjustments",
        },
        {
          title: "Inventory Reports",
          url: "/dashboard/inventory/reports",
        },
      ],
    },
    {
      title: "Website",
      url: "#",
      icon: ChartColumnIncreasing,
      items: [
        {
          title: "Visitor Analytics",
          url: "/dashboard/website-analytics",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: AppSidebarUser;
}) {
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
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
