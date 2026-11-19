"use client";

import * as React from "react";
import {
  BookOpen,
  Factory,
  Globe,
  HardHat,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import { NavMain, type NavigationGroup } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export type AppSidebarUser = {
  name: string;
  email: string;
  avatar?: string | null;
  role?: string | null;
};

const data: { navMain: NavigationGroup[] } = {
  navMain: [
    {
      title: "Sales",
      section: "Operations",
      icon: TrendingUp,
      items: [
        {
          title: "Website enquiries",
          url: "/dashboard/enquiries",
        },
        {
          title: "Gmail inbox",
          url: "/dashboard/inbox",
        },
        {
          title: "Quotations",
          url: "/dashboard/sales/quotations",
        },
        {
          title: "Sales orders",
          url: "/dashboard/sales/orders",
        },
        {
          title: "Pending orders",
          url: "/dashboard/sales/pending",
        },
        {
          title: "Delivery challans",
          url: "/dashboard/sales/delivery-challans",
        },
        {
          title: "Invoices",
          url: "/dashboard/sales/invoices",
        },
      ],
    },
    {
      title: "Purchasing",
      section: "Operations",
      icon: ShoppingCart,
      items: [
        {
          title: "Purchase orders",
          url: "/dashboard/purchase/orders",
        },
        {
          title: "Goods received (GRN)",
          url: "/dashboard/purchase/grn",
        },
      ],
    },
    {
      title: "Manufacturing",
      section: "Operations",
      icon: Factory,
      items: [
        {
          title: "Production planning",
          url: "/dashboard/manufacturing/planning",
        },
        {
          title: "Material issues",
          url: "/dashboard/manufacturing/material-issues",
        },
        {
          title: "Bill of materials (BOM)",
          url: "/dashboard/manufacturing/bom",
        },
        {
          title: "Serial numbers",
          url: "/dashboard/serial",
        },
      ],
    },
    {
      title: "Inventory",
      section: "Operations",
      icon: Package,
      items: [
        {
          title: "Stock summary",
          url: "/dashboard/inventory/stock",
        },
        {
          title: "Stock movements",
          url: "/dashboard/inventory/movements",
        },
        {
          title: "Material returns",
          url: "/dashboard/inventory/returns",
        },
        {
          title: "Stock adjustments",
          url: "/dashboard/inventory/adjustments",
        },
        {
          title: "Inventory reports",
          url: "/dashboard/inventory/reports",
        },
        {
          title: "Go-live setup",
          url: "/dashboard/inventory/go-live",
        },
      ],
    },
    {
      title: "Casting workers",
      section: "People & payroll",
      icon: HardHat,
      items: [
        { title: "Workers", url: "/dashboard/casting-workers" },
        { title: "Casting masters", url: "/dashboard/casting-masters" },
        { title: "Casting jobs (IN / OUT)", url: "/dashboard/manufacturing/casting-jobs" },
        { title: "Material ledger", url: "/dashboard/manufacturing/worker-ledger" },
        { title: "Monthly payroll", url: "/dashboard/contractors/payouts?workforce=casting" },
      ],
    },
    {
      title: "Contractors",
      section: "People & payroll",
      icon: Users,
      items: [
        {
          title: "Workers",
          url: "/dashboard/contractors/workers",
        },
        {
          title: "Rate catalog",
          url: "/dashboard/contractors/rate-catalog",
        },
        {
          title: "Daily entries",
          url: "/dashboard/contractors/entries",
        },
        {
          title: "Monthly payouts",
          url: "/dashboard/contractors/payouts",
        },
      ],
    },
    {
      title: "Records & catalog",
      section: "Manage",
      icon: BookOpen,
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
          title: "Raw materials",
          url: "/dashboard/raw-materials",
        },
        {
          title: "Inventory employees",
          url: "/dashboard/inventory/employees",
        },
      ],
    },
    {
      title: "Website",
      section: "Manage",
      icon: Globe,
      items: [
        {
          title: "Visitor analytics",
          url: "/dashboard/website-analytics",
        },
        {
          title: "Blog articles",
          url: "/dashboard/blog",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  permissions = [],
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: AppSidebarUser;
  permissions?: string[];
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const allowed = (url: string) => {
    const area = url.includes("/sales/invoices") || url.includes("/contractors/payouts") || url.includes("/contractors/workers") ? "accounts"
      : url.includes("/purchase/grn") || url.includes("/material-issues") || url.includes("/inventory/") ? "inventory"
      : url.includes("/sales/") || url.includes("/inbox") || url.includes("/enquiries") ? "sales"
      : url.includes("/purchase/") ? "purchase"
      : url.includes("/manufacturing/") || url.includes("/casting-workers") || url.includes("/contractors/entries") || url.includes("/serial") ? "production"
      : url.includes("/website-analytics") ? "analytics" : url.includes("/blog") ? "content" : "master";
    return permissions.includes(`${area}.read`);
  };
  const navigation = data.navMain
    .map((group) => ({ ...group, items: group.items.filter((item) => allowed(item.url)) }))
    .filter((group) => group.items.length);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="relative border-b border-sidebar-border">
        <Link href="/dashboard" aria-label="Explosion Proof Electrical Control dashboard" onClick={() => setOpenMobile(false)}>
          <div className="relative h-20 group-data-[collapsible=icon]:h-12">
            <Image src="/asset/fullLogo.png" alt="Explosion Proof Electrical Control" fill className="object-contain group-data-[collapsible=icon]:hidden" />
            <Image src="/asset/shortLogo.png" alt="" fill className="hidden object-contain group-data-[collapsible=icon]:block" />
          </div>
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" className="absolute top-1 right-1 size-8" onClick={() => setOpenMobile(false)} aria-label="Close navigation">
            <X aria-hidden="true" />
          </Button>
        )}
      </SidebarHeader>
      <SidebarContent className="dashboard-sidebar-content">
        <NavMain items={navigation} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
