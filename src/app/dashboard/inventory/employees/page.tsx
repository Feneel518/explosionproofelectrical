import InventoryEmployeeManager from "@/components/dashboard/inventory/employees/InventoryEmployeeManager";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  const employees = await prisma.inventoryEmployee.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: { id: true, employeeCode: true, name: true, department: true, designation: true, phone: true, status: true },
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Inventory Employees</h1><p className="text-sm text-muted-foreground">Maintain the company people who can receive raw material.</p></div>
      <InventoryEmployeeManager employees={employees} />
    </div>
  );
}
