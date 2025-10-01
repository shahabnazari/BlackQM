-- AlterTable
ALTER TABLE "Statement" ADD COLUMN "confidence" REAL;
ALTER TABLE "Statement" ADD COLUMN "generationMethod" TEXT;
ALTER TABLE "Statement" ADD COLUMN "perspective" TEXT;
ALTER TABLE "Statement" ADD COLUMN "provenance" JSONB;
ALTER TABLE "Statement" ADD COLUMN "sourcePaperId" TEXT;
ALTER TABLE "Statement" ADD COLUMN "sourceThemeId" TEXT;

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN "basedOnPapersIds" JSONB DEFAULT [];
ALTER TABLE "Survey" ADD COLUMN "extractedThemeIds" JSONB DEFAULT [];
ALTER TABLE "Survey" ADD COLUMN "literatureReviewId" TEXT;
ALTER TABLE "Survey" ADD COLUMN "researchGapId" TEXT;
ALTER TABLE "Survey" ADD COLUMN "studyContext" JSONB;

-- CreateTable
CREATE TABLE "research_pipelines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "literatureSearchIds" JSONB DEFAULT [],
    "selectedPaperIds" JSONB DEFAULT [],
    "extractedThemes" JSONB,
    "researchGaps" JSONB,
    "generatedStatements" JSONB,
    "statementProvenance" JSONB,
    "methodSuggestions" JSONB,
    "analysisIds" JSONB DEFAULT [],
    "factorInterpretations" JSONB,
    "reportIds" JSONB DEFAULT [],
    "narratives" JSONB,
    "doiIdentifier" TEXT,
    "archiveMetadata" JSONB,
    "currentPhase" TEXT NOT NULL DEFAULT 'literature',
    "completedPhases" JSONB DEFAULT [],
    "pipelineMetadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "research_pipelines_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "research_pipelines_surveyId_key" ON "research_pipelines"("surveyId");

-- CreateIndex
CREATE INDEX "research_pipelines_surveyId_idx" ON "research_pipelines"("surveyId");
