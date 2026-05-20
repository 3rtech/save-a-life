import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const existing = await db.admin.findUnique({ where: { email: "admin@savealifedonors.org" } });
  if (existing) {
    console.log("Seed admin already exists.");
    return;
  }

  const passwordHash = await hash("Admin1234!", 12);

  await db.admin.create({
    data: {
      name: "Super Admin",
      email: "admin@savealifedonors.org",
      passwordHash,
      role: "super_admin",
      status: "active",
    },
  });

  console.log("✓ Seed admin created: admin@savealifedonors.org / Admin1234!");
  console.log("  Change this password immediately after first login.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
