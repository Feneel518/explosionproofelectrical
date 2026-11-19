"use client";

import { Suspense, useState, type CSSProperties } from "react";
import { ChevronRight, LayoutDashboard, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type NavigationGroup = {
  title: string;
  section: string;
  icon: LucideIcon;
  items: { title: string; url: string }[];
};

export function NavMain({ items }: { items: NavigationGroup[] }) {
  return <Suspense><RouteNavigation items={items} /></Suspense>;
}

function RouteNavigation({ items }: { items: NavigationGroup[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Prefer the most specific destination, including workforce-specific payroll.
  const activeUrl = items.flatMap((group) => group.items).reduce<string | null>((match, item) => {
    const target = new URL(item.url, "https://sidebar.local");
    const matchesPath = pathname === target.pathname || pathname.startsWith(target.pathname + "/");
    const matchesQuery = Array.from(target.searchParams).every(([key, value]) => searchParams.get(key) === value);
    return matchesPath && matchesQuery && item.url.length > (match?.length ?? 0) ? item.url : match;
  }, null);

  return <NavigationMenu key={pathname + "?" + searchParams.toString()} items={items} activeUrl={activeUrl} isDashboard={pathname === "/dashboard"} />;
}

function NavigationMenu({ items, activeUrl, isDashboard }: { items: NavigationGroup[]; activeUrl: string | null; isDashboard: boolean }) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [openGroup, setOpenGroup] = useState<string | null>(items.find((group) => group.items.some((item) => item.url === activeUrl))?.title ?? null);
  const sections = Array.from(new Set(items.map((group) => group.section)));
  const isCollapsed = state === "collapsed" && !isMobile;
  const closeMobile = () => setOpenMobile(false);

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 py-2">
      <SidebarGroup className="py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isDashboard} tooltip="Dashboard" className="h-10 xl:h-9">
              <Link href="/dashboard" aria-current={isDashboard ? "page" : undefined} onClick={closeMobile}>
                <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {sections.map((section) => (
        <SidebarGroup key={section} className="py-0">
          <SidebarGroupLabel>{section}</SidebarGroupLabel>
          <SidebarMenu>
            {items.filter((group) => group.section === section).map((group) => {
              const isActive = group.items.some((item) => item.url === activeUrl);
              const Icon = group.icon;
              if (isCollapsed) {
                return (
                  <SidebarMenuItem key={group.title}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton tooltip={group.title} isActive={isActive} aria-label={group.title}>
                          <Icon aria-hidden="true" /><span>{group.title}</span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        sideOffset={8}
                        className="min-w-60"
                        style={{
                          "--popover": "var(--sidebar)",
                          "--popover-foreground": "var(--sidebar-foreground)",
                        } as CSSProperties}>
                        <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          {group.items.map((item) => (
                            <DropdownMenuItem key={item.url} asChild>
                              <Link href={item.url} aria-current={item.url === activeUrl ? "page" : undefined}>{item.title}</Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              }
              return (
                <Collapsible key={group.title} asChild open={openGroup === group.title} onOpenChange={(open) => setOpenGroup(open ? group.title : null)} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isActive && openGroup !== group.title} className="h-10 xl:h-9">
                        <Icon aria-hidden="true" /><span>{group.title}</span>
                        <ChevronRight aria-hidden="true" className="ml-auto transition-transform duration-150 group-data-[state=open]/collapsible:rotate-90 motion-reduce:transition-none" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="my-1">
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild isActive={item.url === activeUrl} className="h-10 xl:h-8">
                              <Link href={item.url} aria-current={item.url === activeUrl ? "page" : undefined} onClick={closeMobile}><span>{item.title}</span></Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </nav>
  );
}
