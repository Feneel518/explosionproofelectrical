"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { requireInventoryAccess } from "@/lib/check/inventoryAccess";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

function text(value: FormDataEntryValue | null) {
  const result = String(value ?? "").trim();
  return result || null;
}

export async function saveInventoryEmployeeAction(formData: FormData) {
  const session = await requireInventoryAccess("WRITE");
  const id = text(formData.get("id"));
  const employeeCode = text(formData.get("employeeCode"))?.toUpperCase();
  const name = text(formData.get("name"));

  if (!employeeCode || !name) {
    return { ok: false as const, message: "Employee code and name are required." };
  }

  const duplicate = await prisma.inventoryEmployee.findFirst({
    where: { employeeCode, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (duplicate) {
    return { ok: false as const, message: "Employee code already exists." };
  }

  const data = {
    employeeCode,
    name,
    department: text(formData.get("department")),
    designation: text(formData.get("designation")),
    phone: text(formData.get("phone")),
    updatedById: session.user.id,
  };

  if (id) {
    await prisma.inventoryEmployee.update({ where: { id }, data });
  } else {
    await prisma.inventoryEmployee.create({
      data: { ...data, createdById: session.user.id },
    });
  }

  revalidatePath("/dashboard/inventory/employees");
  return { ok: true as const, message: id ? "Employee updated." : "Employee created." };
}

export async function setInventoryEmployeeStatusAction(
  id: string,
  status: "ACTIVE" | "INACTIVE",
) {
  const session = await requireInventoryAccess("WRITE");
  await prisma.inventoryEmployee.update({
    where: { id },
    data: { status, updatedById: session.user.id },
  });
  revalidatePath("/dashboard/inventory/employees");
  return { ok: true as const };
}

export async function getActiveInventoryEmployeesAction() {
  await requireAuth();
  const employees = await prisma.inventoryEmployee.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ name: "asc" }, { employeeCode: "asc" }],
    select: {
      id: true,
      employeeCode: true,
      name: true,
      department: true,
      designation: true,
    },
  });
  return { ok: true as const, employees };
}
