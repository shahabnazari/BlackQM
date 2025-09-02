-- CreateTable
CREATE TABLE "ParticipantProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL DEFAULT 'welcome',
    "completedSteps" JSONB NOT NULL DEFAULT [],
    "stepData" JSONB,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParticipantProgress_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreSort" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "disagree" JSONB NOT NULL,
    "neutral" JSONB NOT NULL,
    "agree" JSONB NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PreSort_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commentary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Commentary_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "tenantId" TEXT DEFAULT 'default',
    "scheduledStart" DATETIME,
    "scheduledEnd" DATETIME,
    "maxResponses" INTEGER,
    "currentResponses" INTEGER NOT NULL DEFAULT 0,
    "gridColumns" INTEGER NOT NULL DEFAULT 9,
    "gridShape" TEXT NOT NULL DEFAULT 'quasi-normal',
    "gridConfig" JSONB,
    "welcomeMessage" TEXT,
    "consentText" TEXT,
    "enablePreScreening" BOOLEAN NOT NULL DEFAULT false,
    "enablePostSurvey" BOOLEAN NOT NULL DEFAULT true,
    "enableVideoConferencing" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Survey_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Survey" ("createdAt", "createdBy", "currentResponses", "description", "id", "maxResponses", "scheduledEnd", "scheduledStart", "settings", "status", "tenantId", "title", "updatedAt") SELECT "createdAt", "createdBy", "currentResponses", "description", "id", "maxResponses", "scheduledEnd", "scheduledStart", "settings", "status", "tenantId", "title", "updatedAt" FROM "Survey";
DROP TABLE "Survey";
ALTER TABLE "new_Survey" RENAME TO "Survey";
CREATE INDEX "Survey_createdBy_idx" ON "Survey"("createdBy");
CREATE INDEX "Survey_tenantId_idx" ON "Survey"("tenantId");
CREATE INDEX "Survey_status_idx" ON "Survey"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantProgress_responseId_key" ON "ParticipantProgress"("responseId");

-- CreateIndex
CREATE INDEX "ParticipantProgress_responseId_idx" ON "ParticipantProgress"("responseId");

-- CreateIndex
CREATE UNIQUE INDEX "PreSort_responseId_key" ON "PreSort"("responseId");

-- CreateIndex
CREATE INDEX "PreSort_responseId_idx" ON "PreSort"("responseId");

-- CreateIndex
CREATE INDEX "Commentary_responseId_idx" ON "Commentary"("responseId");

-- CreateIndex
CREATE INDEX "Commentary_statementId_idx" ON "Commentary"("statementId");
