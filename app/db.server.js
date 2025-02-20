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

export const instagramPostCreateOrUpdate = async ({
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
      posts: true,
    },
  });
};

// all post related functions

export const getPosts = async () => {
  return prisma.instagramPost.findMany();
};

export const deleteAllPostByAccountId = async (accountId) => {
  return prisma.instagramPost.deleteMany({
    where: {
      accountId: accountId,
    },
  });
};

export const getAllInstagramPostbyCondition = async (condition) => {
  try {
    const posts = await prisma.instagramPost.findMany({
      include: {
        account: true,
      },
      where: { ...condition },
    });

    return posts;
  } catch (error) {
    console.error("Error fetching Instagram posts:", error);
    return { error: "Failed to fetch posts", details: error };
  }
};

export const findPostById = async (postId) => {
  return prisma.instagramPost.findUnique({
    where: {
      id: postId,
    },
  });
};

export const updatePostData = async (postId, fieldName, fieldValue) => {
  return prisma.instagramPost.update({
    where: {
      id: String(postId),
    },
    data: {
      [fieldName]: fieldValue,
    },
  });
};

export const storeInstagramPosts = async (posts = [], accountId) => {
  try {
    for (const post of posts) {
      // Check if post already exists
      const existingPost = await prisma.instagramPost.findUnique({
        where: { id: post.id },
      });

      if (!existingPost) {
        await prisma.instagramPost.create({
          data: {
            id: post.id,
            mediaType: post.media_type,
            mediaUrl: post.media_url,
            thumbnailUrl: post.thumbnail_url || null,
            permalink: post.permalink,
            timestamp: new Date(post.timestamp),
            username: post.username,
            caption: post.caption || null,
            accountId: accountId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  } catch (error) {
    console.error("Error storing Instagram posts:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

export const getAllInstagramPostbyAccountId = async (accountId) => {
  return prisma.instagramPost.findMany({
    where: {
      accountId: accountId,
    }
  });
};

export const getFilteredInstagramPosts = async (searchQuery, filterValue, username) => {
  const whereClauses = {
    AND: [
      {
        username: username,
      },
      ...(searchQuery ? [{
        caption: {
          contains: searchQuery,
        },
      }] : []),
      {
        mediaType: filterValue !== 'all' ? filterValue : undefined,
      }
    ],
  };


  if (!searchQuery && filterValue === "all") {
    console.log("hello come here....");
    return prisma.instagramPost.findMany({
      where: {
        username: username
      },
      include: {
        account: true
      },

    });
  }

  const posts = await prisma.instagramPost.findMany({
    where: whereClauses,
    include: {
      account: true
    },
  })

  console.log("Posts: ", posts);

  return posts;
}

export default prisma;
