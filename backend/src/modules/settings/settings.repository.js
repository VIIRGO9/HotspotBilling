import { prisma } from "../../shared/database/prisma.js";

export const SettingsRepository = {
  findAll: async () =>
    prisma.systemSetting.findMany({ orderBy: { type: "asc" } }),
  findByKey: async (key) => prisma.systemSetting.findUnique({ where: { key } }),
  upsert: async (key, data) =>
    prisma.systemSetting.upsert({
      where: { key },
      update: { value: data.value, description: data.description },
      create: {
        key,
        value: data.value,
        description: data.description,
        type: "GENERAL",
      },
    }),
};
