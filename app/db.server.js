import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV !== "production") {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
}

const prisma = global.prisma || new PrismaClient();

export const createOrUpdate = async ({
  instagramId,
  instagramUsername,
  instagramToken,
  instagramTokenExpires,
  accountType,
}) => {
  return prisma.instagramAccount.upsert({
    where: {
      instagramId,
    },
    update: {
      instagramUsername,
      instagramToken,
      instagramTokenExpires,
      accountType,
    },
    create: {
      instagramId,
      instagramUsername,
      instagramToken,
      instagramTokenExpires,
      accountType,
    },
  });
};

export const getAllInstagramAccounts = async () => {
  return prisma.instagramAccount.findMany();
};

export const findUserByInstagramId = async (instagramId) => {
  return prisma.instagramAccount.findUnique({
    where: {
      instagramId: instagramId,
    },
  });
};

export const findUserByInstagramUsername = async (instagramUsername) => {
  return prisma.instagramAccount.findFirst({
    where: {
      instagramUsername: instagramUsername,
    },
    include: {
      posts: {
        orderBy: {
          timestamp: "desc",
        },
      },
    },
  });
};

export default prisma;
