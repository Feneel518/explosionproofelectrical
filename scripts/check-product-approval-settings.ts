import "dotenv/config";
import { prisma } from "../src/lib/prisma/db";

async function main() {
  const [settings, pendingRequests] = await Promise.all([
    prisma.productApprovalSettings.findUnique({
      where: { id: "product-approval" },
      select: {
        approvalEmail: true,
        requireProductApproval: true,
        requireVariantApproval: true,
        sendEmailNotifications: true,
      },
    }),
    prisma.productApprovalRequest.count({ where: { status: "PENDING" } }),
  ]);

  console.log(JSON.stringify({ ...settings, pendingRequests }));
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
