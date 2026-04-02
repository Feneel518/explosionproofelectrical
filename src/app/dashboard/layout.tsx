import DashboardBreadcrumbs from "@/components/dashboard/global/DashboardBreadcrumbs";
import QuotationFollowupReminderToast from "@/components/dashboard/sales/quotation/QuotationFollowupReminderToast";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireAuth } from "@/lib/check/requireAuth";
import { FC } from "react";

interface layoutProps {
  children: React.ReactNode;
}

const layout: FC<layoutProps> = async ({ children }) => {
  const { user } = await requireAuth();
  const sidebarUser = {
    name: user.name || "Dashboard User",
    email: user.email || "unknown@example.com",
    avatar: user.image || null,
    role:
      typeof (user as { role?: unknown }).role === "string"
        ? ((user as { role?: string }).role ?? null)
        : null,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset>
        <header className="flex h-14 lg:h-24 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 border-b">
          <QuotationFollowupReminderToast />
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1  p-2 cursor-pointer" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-10"
            />
            <DashboardBreadcrumbs></DashboardBreadcrumbs>
          </div>
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default layout;
