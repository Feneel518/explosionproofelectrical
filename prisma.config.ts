import { defineConfig, env } from "prisma/config";
import "dotenv/config"; // 👈 add this line

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
