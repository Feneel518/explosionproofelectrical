"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { MaterialIssueDraftData } from "./createDraftMaterialIssueAction";

export async function getMaterialIssueDraftAction(id: string) {
  await requireAuth();

  const issue = await prisma.materialIssue.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      issueNo: true,
      issueFy: true,
      draftData: true,
      draftVersion: true,
    },
  });

  if (!issue) {
    return { ok: false as const, message: "Material issue not found." };
  }

  if (issue.status !== "DRAFT") {
    return {
      ok: false as const,
      message: "Material issue is finalized and cannot be edited.",
    };
  }

  const draft = (issue.draftData ?? {
    header: {
      issueDate: new Date().toISOString(),
      issueType: "INTERNAL_USE",
      issuedToName: "",
      issuedByName: "",
      directSaleCustomerName: "",
      directSaleReferenceNo: "",
      department: "",
      purpose: "",
      workReference: "",
      remarks: "",
    },
    items: [],
  }) as MaterialIssueDraftData;

  return {
    ok: true as const,
    materialIssueId: issue.id,
    issueNo: issue.issueNo,
    issueFy: issue.issueFy,
    draft,
    draftVersion: issue.draftVersion,
  };
}
