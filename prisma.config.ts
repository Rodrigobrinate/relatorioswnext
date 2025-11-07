import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: 'postgresql://postgres:a850d1b912eb7f2d9cf6@45.165.244.102:5432/relatorio',
  },
});
