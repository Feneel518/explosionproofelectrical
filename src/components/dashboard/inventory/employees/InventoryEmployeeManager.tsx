"use client";

import React from "react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveInventoryEmployeeAction,
  setInventoryEmployeeStatusAction,
} from "@/lib/actions/dashboard/inventory/employees/inventoryEmployeeActions";

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  department: string | null;
  designation: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export default function InventoryEmployeeManager({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Employee | null>(null);
  const [pending, setPending] = React.useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    const result = await saveInventoryEmployeeAction(formData);
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setEditing(null);
    router.refresh();
  }

  async function toggle(employee: Employee) {
    await setInventoryEmployeeStatusAction(
      employee.id,
      employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
    );
    toast.success(employee.status === "ACTIVE" ? "Employee deactivated." : "Employee activated.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form action={submit} className="space-y-4 rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">{editing ? "Edit employee" : "Add employee"}</h2>
          <p className="text-sm text-muted-foreground">Employees can receive raw materials without needing a login.</p>
        </div>
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <Input name="employeeCode" placeholder="Employee code *" defaultValue={editing?.employeeCode ?? ""} key={`${editing?.id}-code`} />
        <Input name="name" placeholder="Employee name *" defaultValue={editing?.name ?? ""} key={`${editing?.id}-name`} />
        <Input name="department" placeholder="Department" defaultValue={editing?.department ?? ""} key={`${editing?.id}-department`} />
        <Input name="designation" placeholder="Designation" defaultValue={editing?.designation ?? ""} key={`${editing?.id}-designation`} />
        <Input name="phone" placeholder="Phone" defaultValue={editing?.phone ?? ""} key={`${editing?.id}-phone`} />
        <div className="flex gap-2">
          <Button disabled={pending}>{pending ? "Saving..." : "Save employee"}</Button>
          {editing ? <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button> : null}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-[100px_1fr_1fr_120px] gap-3 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
          <span>Code</span><span>Employee</span><span>Department</span><span>Actions</span>
        </div>
        {employees.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No employees created yet.</p> : employees.map((employee) => (
          <div key={employee.id} className="grid grid-cols-[100px_1fr_1fr_120px] items-center gap-3 border-b px-4 py-3 text-sm last:border-0">
            <span>{employee.employeeCode}</span>
            <span><span className="block font-medium">{employee.name}</span><span className="text-xs text-muted-foreground">{employee.designation ?? "—"}</span></span>
            <span>{employee.department ?? "—"}</span>
            <span className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(employee)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => toggle(employee)}>{employee.status === "ACTIVE" ? "Disable" : "Enable"}</Button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
