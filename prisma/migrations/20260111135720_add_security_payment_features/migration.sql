-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "fingerprint" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserOnboarding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userType" TEXT,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "firstPromptViewed" BOOLEAN NOT NULL DEFAULT false,
    "firstPromptCreated" BOOLEAN NOT NULL DEFAULT false,
    "firstPromptPublished" BOOLEAN NOT NULL DEFAULT false,
    "bankAccountAdded" BOOLEAN NOT NULL DEFAULT false,
    "firstSale" BOOLEAN NOT NULL DEFAULT false,
    "firstPromptTried" BOOLEAN NOT NULL DEFAULT false,
    "firstPurchase" BOOLEAN NOT NULL DEFAULT false,
    "firstReview" BOOLEAN NOT NULL DEFAULT false,
    "firstResultLog" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethodAdded" BOOLEAN NOT NULL DEFAULT false,
    "tourShown" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "pendingBalance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalWithdrawn" INTEGER NOT NULL DEFAULT 0,
    "orynthWalletId" TEXT,
    "orynthConnected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "walletId" TEXT NOT NULL,
    "purchaseId" TEXT,
    CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" INTEGER NOT NULL,
    "fee" INTEGER NOT NULL DEFAULT 250,
    "netAmount" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "failureReason" TEXT,
    "transferId" TEXT,
    "walletId" TEXT NOT NULL,
    CONSTRAINT "PayoutRequest_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputVariables" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "outputText" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "costCredits" INTEGER NOT NULL DEFAULT 0,
    "wasBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    CONSTRAINT "PromptExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromptExecution_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsageQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freeExecutions" INTEGER NOT NULL DEFAULT 0,
    "paidExecutions" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UsageQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiCostLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "costUSD" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrerCode" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "totalSignups" INTEGER NOT NULL DEFAULT 0,
    "totalRewards" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralSignup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referralId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "rewardStatus" TEXT NOT NULL DEFAULT 'pending',
    "rewardAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspicionReason" TEXT,
    CONSTRAINT "ReferralSignup_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralSignup_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrynthActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "orynthPostId" TEXT,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceAtPurchase" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "paymentProvider" TEXT NOT NULL DEFAULT 'credits',
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "orynthTxId" TEXT,
    "refundedAt" DATETIME,
    "refundReason" TEXT,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Purchase_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("createdAt", "id", "priceAtPurchase", "promptId", "userId") SELECT "createdAt", "id", "priceAtPurchase", "promptId", "userId" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE UNIQUE INDEX "Purchase_stripeSessionId_key" ON "Purchase"("stripeSessionId");
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");
CREATE INDEX "Purchase_promptId_idx" ON "Purchase"("promptId");
CREATE INDEX "Purchase_status_idx" ON "Purchase"("status");
CREATE INDEX "Purchase_stripeSessionId_idx" ON "Purchase"("stripeSessionId");
CREATE UNIQUE INDEX "Purchase_userId_promptId_key" ON "Purchase"("userId", "promptId");
CREATE TABLE "new_ResultLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricType" TEXT NOT NULL,
    "metricValue" REAL NOT NULL,
    "metricUnit" TEXT NOT NULL,
    "note" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    CONSTRAINT "ResultLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResultLog_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ResultLog" ("createdAt", "id", "metricType", "metricUnit", "metricValue", "note", "promptId", "userId") SELECT "createdAt", "id", "metricType", "metricUnit", "metricValue", "note", "promptId", "userId" FROM "ResultLog";
DROP TABLE "ResultLog";
ALTER TABLE "new_ResultLog" RENAME TO "ResultLog";
CREATE INDEX "ResultLog_userId_idx" ON "ResultLog"("userId");
CREATE INDEX "ResultLog_promptId_idx" ON "ResultLog"("promptId");
CREATE INDEX "ResultLog_metricType_idx" ON "ResultLog"("metricType");
CREATE INDEX "ResultLog_createdAt_idx" ON "ResultLog"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LoginLog_userId_idx" ON "LoginLog"("userId");

-- CreateIndex
CREATE INDEX "LoginLog_ipAddress_idx" ON "LoginLog"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UserOnboarding_userId_key" ON "UserOnboarding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "PayoutRequest_walletId_idx" ON "PayoutRequest"("walletId");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- CreateIndex
CREATE INDEX "PayoutRequest_createdAt_idx" ON "PayoutRequest"("createdAt");

-- CreateIndex
CREATE INDEX "PromptExecution_userId_idx" ON "PromptExecution"("userId");

-- CreateIndex
CREATE INDEX "PromptExecution_promptId_idx" ON "PromptExecution"("promptId");

-- CreateIndex
CREATE INDEX "PromptExecution_createdAt_idx" ON "PromptExecution"("createdAt");

-- CreateIndex
CREATE INDEX "PromptExecution_model_idx" ON "PromptExecution"("model");

-- CreateIndex
CREATE INDEX "UsageQuota_userId_idx" ON "UsageQuota"("userId");

-- CreateIndex
CREATE INDEX "UsageQuota_date_idx" ON "UsageQuota"("date");

-- CreateIndex
CREATE UNIQUE INDEX "UsageQuota_userId_date_key" ON "UsageQuota"("userId", "date");

-- CreateIndex
CREATE INDEX "ApiCostLog_date_idx" ON "ApiCostLog"("date");

-- CreateIndex
CREATE INDEX "ApiCostLog_model_idx" ON "ApiCostLog"("model");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerCode_key" ON "Referral"("referrerCode");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referrerCode_idx" ON "Referral"("referrerCode");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralSignup_referredUserId_key" ON "ReferralSignup"("referredUserId");

-- CreateIndex
CREATE INDEX "ReferralSignup_referralId_idx" ON "ReferralSignup"("referralId");

-- CreateIndex
CREATE INDEX "ReferralSignup_rewardStatus_idx" ON "ReferralSignup"("rewardStatus");

-- CreateIndex
CREATE INDEX "OrynthActivity_type_idx" ON "OrynthActivity"("type");

-- CreateIndex
CREATE INDEX "OrynthActivity_createdAt_idx" ON "OrynthActivity"("createdAt");

-- CreateIndex
CREATE INDEX "CreditHistory_createdAt_idx" ON "CreditHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Prompt_publishedAt_idx" ON "Prompt"("publishedAt");
