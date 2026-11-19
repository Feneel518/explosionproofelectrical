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
          title: "Website enquiries",
          url: "/dashboard/enquiries",
        },
        {
          title: "Gmail Sales Inbox",
          url: "/dashboard/inbox",
        },
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
          title: "Production Planning",
          url: "/dashboard/manufacturing/planning",
        },
      ],
    },
    {
      title: "Casting Workers",
      url: "#",
      icon: AudioWaveform,
      items: [
        { title: "Workers", url: "/dashboard/casting-workers" },
        { title: "Casting Masters", url: "/dashboard/casting-masters" },
        { title: "Post IN / OUT", url: "/dashboard/manufacturing/casting-jobs" },
        { title: "Material Ledger", url: "/dashboard/manufacturing/worker-ledger" },
        { title: "Monthly Payroll", url: "/dashboard/contractors/payouts?workforce=casting" },
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
        {
          title: "Blog Articles",
          url: "/dashboard/blog",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user, permissions = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: AppSidebarUser;
  permissions?: string[];
}) {
  const allowed = (url: string) => {
    const area = url.includes("/sales/invoices") || url.includes("/contractors/payouts") || url.includes("/contractors/workers") ? "accounts"
      : url.includes("/purchase/grn") || url.includes("/material-issues") || url.includes("/inventory/") ? "inventory"
      : url.includes("/sales/") || url.includes("/inbox") || url.includes("/enquiries") ? "sales"
      : url.includes("/purchase/") ? "purchase"
      : url.includes("/manufacturing/") || url.includes("/casting-workers") || url.includes("/contractors/entries") || url.includes("/serial") ? "production"
      : url.includes("/website-analytics") ? "analytics" : url.includes("/blog") ? "content" : "master";
    return permissions.includes(`${area}.read`);
  };
  const navigation = data.navMain.map(group => ({ ...group, items: group.items.filter(item => allowed(item.url)) })).filter(group => group.items.length);
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
        <NavMain items={navigation} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
