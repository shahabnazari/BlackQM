-- AlterTable
ALTER TABLE "research_gaps" ADD COLUMN "completionPercentage" REAL DEFAULT 0.0;
ALTER TABLE "research_gaps" ADD COLUMN "findings" JSONB;
ALTER TABLE "research_gaps" ADD COLUMN "lastUpdated" DATETIME;
ALTER TABLE "research_gaps" ADD COLUMN "status" TEXT DEFAULT 'identified';

-- CreateTable
CREATE TABLE "knowledge_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sourceStudyId" TEXT,
    "sourcePaperId" TEXT,
    "confidence" REAL DEFAULT 0.5,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "knowledge_edges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "knowledge_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "knowledge_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "knowledge_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "knowledge_base" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "sourceStudyId" TEXT,
    "citations" JSONB,
    "tags" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "needsReplication" BOOLEAN NOT NULL DEFAULT true,
    "supportingStudies" JSONB DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastVerified" DATETIME
);

-- CreateTable
CREATE TABLE "knowledge_cross_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_cross_references_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "knowledge_base" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "knowledge_cross_references_toId_fkey" FOREIGN KEY ("toId") REFERENCES "knowledge_base" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "factors" JSONB,
    "consensus" JSONB,
    "distinguishing" JSONB,
    "totalVariance" REAL,
    "participantCount" INTEGER,
    "comparisonId" TEXT,
    "comparison" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analysis_results_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "statement_provenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "statementId" TEXT NOT NULL,
    "sourcePaperId" TEXT,
    "sourceThemeId" TEXT,
    "generationMethod" TEXT,
    "confidence" REAL DEFAULT 0.5,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "statement_provenance_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "Statement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "statement_provenance_sourcePaperId_fkey" FOREIGN KEY ("sourcePaperId") REFERENCES "papers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "statement_provenance_sourceThemeId_fkey" FOREIGN KEY ("sourceThemeId") REFERENCES "paper_themes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "basedOnPapersIds" JSONB DEFAULT [],
    "researchGapId" TEXT,
    "extractedThemeIds" JSONB DEFAULT [],
    "studyContext" JSONB,
    "literatureReviewId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Survey_researchGapId_fkey" FOREIGN KEY ("researchGapId") REFERENCES "research_gaps" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Survey_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Survey" ("basedOnPapersIds", "consentText", "createdAt", "createdBy", "currentResponses", "description", "enablePostSurvey", "enablePreScreening", "enableVideoConferencing", "extractedThemeIds", "gridColumns", "gridConfig", "gridShape", "id", "literatureReviewId", "maxResponses", "researchGapId", "scheduledEnd", "scheduledStart", "settings", "status", "studyContext", "tenantId", "title", "updatedAt", "welcomeMessage") SELECT "basedOnPapersIds", "consentText", "createdAt", "createdBy", "currentResponses", "description", "enablePostSurvey", "enablePreScreening", "enableVideoConferencing", "extractedThemeIds", "gridColumns", "gridConfig", "gridShape", "id", "literatureReviewId", "maxResponses", "researchGapId", "scheduledEnd", "scheduledStart", "settings", "status", "studyContext", "tenantId", "title", "updatedAt", "welcomeMessage" FROM "Survey";
DROP TABLE "Survey";
ALTER TABLE "new_Survey" RENAME TO "Survey";
CREATE INDEX "Survey_createdBy_idx" ON "Survey"("createdBy");
CREATE INDEX "Survey_tenantId_idx" ON "Survey"("tenantId");
CREATE INDEX "Survey_status_idx" ON "Survey"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "knowledge_nodes_type_idx" ON "knowledge_nodes"("type");

-- CreateIndex
CREATE INDEX "knowledge_nodes_sourceStudyId_idx" ON "knowledge_nodes"("sourceStudyId");

-- CreateIndex
CREATE INDEX "knowledge_nodes_sourcePaperId_idx" ON "knowledge_nodes"("sourcePaperId");

-- CreateIndex
CREATE INDEX "knowledge_edges_fromNodeId_idx" ON "knowledge_edges"("fromNodeId");

-- CreateIndex
CREATE INDEX "knowledge_edges_toNodeId_idx" ON "knowledge_edges"("toNodeId");

-- CreateIndex
CREATE INDEX "knowledge_edges_type_idx" ON "knowledge_edges"("type");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_edges_fromNodeId_toNodeId_type_key" ON "knowledge_edges"("fromNodeId", "toNodeId", "type");

-- CreateIndex
CREATE INDEX "knowledge_base_type_idx" ON "knowledge_base"("type");

-- CreateIndex
CREATE INDEX "knowledge_base_category_idx" ON "knowledge_base"("category");

-- CreateIndex
CREATE INDEX "knowledge_base_sourceStudyId_idx" ON "knowledge_base"("sourceStudyId");

-- CreateIndex
CREATE INDEX "knowledge_base_isVerified_idx" ON "knowledge_base"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_cross_references_fromId_toId_key" ON "knowledge_cross_references"("fromId", "toId");

-- CreateIndex
CREATE INDEX "analysis_results_surveyId_idx" ON "analysis_results"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "statement_provenance_statementId_key" ON "statement_provenance"("statementId");

-- CreateIndex
CREATE INDEX "statement_provenance_sourcePaperId_idx" ON "statement_provenance"("sourcePaperId");

-- CreateIndex
CREATE INDEX "statement_provenance_sourceThemeId_idx" ON "statement_provenance"("sourceThemeId");
