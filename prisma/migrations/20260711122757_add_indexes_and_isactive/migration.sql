-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "balance" REAL NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("balance", "createdAt", "email", "id", "name", "password", "role", "updatedAt") SELECT "balance", "createdAt", "email", "id", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "InvestmentPlan_active_idx" ON "InvestmentPlan"("active");

-- CreateIndex
CREATE INDEX "InvestmentPlan_riskLevel_idx" ON "InvestmentPlan"("riskLevel");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_type_idx" ON "Transaction"("userId", "type");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "UserInvestment_userId_idx" ON "UserInvestment"("userId");

-- CreateIndex
CREATE INDEX "UserInvestment_status_idx" ON "UserInvestment"("status");

-- CreateIndex
CREATE INDEX "UserInvestment_maturityDate_idx" ON "UserInvestment"("maturityDate");

-- CreateIndex
CREATE INDEX "UserInvestment_userId_status_idx" ON "UserInvestment"("userId", "status");

-- CreateIndex
CREATE INDEX "UserInvestment_status_maturityDate_idx" ON "UserInvestment"("status", "maturityDate");
