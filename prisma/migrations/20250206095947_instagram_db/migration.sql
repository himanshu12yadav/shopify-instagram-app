-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "InstagramAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instagramId" TEXT,
    "instagramUsername" TEXT,
    "instagramToken" TEXT,
    "instagramTokenExpires" DATETIME,
    "accountType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaType" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "permalink" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "username" TEXT NOT NULL,
    "caption" TEXT,
    "accountId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstagramPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SelectedPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "selectionStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SelectedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SelectedPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramAccount_instagramId_key" ON "InstagramAccount"("instagramId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramAccount_instagramUsername_key" ON "InstagramAccount"("instagramUsername");

-- CreateIndex
CREATE INDEX "InstagramPost_accountId_idx" ON "InstagramPost"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "SelectedPost_postId_key" ON "SelectedPost"("postId");

-- CreateIndex
CREATE INDEX "SelectedPost_accountId_idx" ON "SelectedPost"("accountId");

-- CreateIndex
CREATE INDEX "SelectedPost_selectionStatus_idx" ON "SelectedPost"("selectionStatus");
