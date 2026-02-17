"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { FC } from "react";

interface DashboardBreadcrumbsProps {}
function titleize(seg: string) {
  const s = decodeURIComponent(seg).replace(/[-_]+/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const DashboardBreadcrumbs: FC<DashboardBreadcrumbsProps> = ({}) => {
  const pathname = usePathname();

  const segments = pathname
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean);

  // Example: /dashboard/parties/new -> ["dashboard","parties","new"]
  // If this breadcrumb is only inside /dashboard layout, you can skip "dashboard" display if you want.
  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    return { seg, href, label: titleize(seg) };
  });

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="">
      <BreadcrumbList>
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1;

          return (
            <React.Fragment key={c.href}>
              <BreadcrumbItem
                className={idx === 0 ? "hidden md:block" : undefined}>
                {isLast ? (
                  <BreadcrumbPage className="text-xl font-thin">
                    {c.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href} className="text-xl">
                      {c.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default DashboardBreadcrumbs;
