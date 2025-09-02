-- CreateTable
CREATE TABLE "TwoFactorBackup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TwoFactorBackup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TwoFactorBackup_userId_idx" ON "TwoFactorBackup"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorBackup_used_idx" ON "TwoFactorBackup"("used");
