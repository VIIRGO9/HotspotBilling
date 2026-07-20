// backend/prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Create Default Super Admin
  const passwordHash = await bcrypt.hash("Admin@Senete2026!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@senetebilling.com" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@senetebilling.com",
      phone: "+255700000000",
      password: passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`Created Admin User: ${admin.email}`);

  // 2. Create default internet package seed data.
  const packagesData = [
    {
      name: "1 Hour Basic",
      description: "Short term access for quick browsing",
      type: "TIME",
      price: 500.0,
      duration: 1,
      validityUnit: "HOUR",
      downloadSpeedMbps: 5,
      uploadSpeedMbps: 2,
      deviceLimit: 1,
      status: "ACTIVE",
      isActive: true,
    },
    {
      name: "1 Day Standard",
      description: "24-hour access with data cap",
      type: "HYBRID",
      price: 1500.0,
      duration: 1,
      validityUnit: "DAY",
      downloadSpeedMbps: 10,
      uploadSpeedMbps: 5,
      dataLimitGB: 2.0,
      deviceLimit: 2,
      status: "ACTIVE",
      isActive: true,
    },
    {
      name: "30 Days Premium",
      description: "Monthly unlimited access",
      type: "UNLIMITED",
      price: 25000.0,
      duration: 30,
      validityUnit: "DAY",
      downloadSpeedMbps: 20,
      uploadSpeedMbps: 10,
      deviceLimit: 3,
      status: "ACTIVE",
      isActive: true,
    },
  ];

  for (const pkg of packagesData) {
    await prisma.package.upsert({
      where: { name: pkg.name },
      update: {},
      create: pkg,
    });
  }
  console.log(`Created ${packagesData.length} Sample Packages`);

  // 3. Create Default System Settings
  const settingsData = [
    {
      key: "SYSTEM_CURRENCY",
      value: "TZS",
      type: "GENERAL",
      description: "Default system currency",
    },
    {
      key: "VOUCHER_CODE_LENGTH",
      value: 12,
      type: "GENERAL",
      description: "Length of generated voucher codes",
    },
    {
      key: "SESSION_TIMEOUT_MINUTES",
      value: 30,
      type: "SECURITY",
      description: "Admin dashboard inactivity timeout",
    },
  ];

  for (const setting of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`Created Default System Settings`);

  console.log("🎉 Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
