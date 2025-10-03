-- CreateTable
CREATE TABLE "unified_themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "keywords" JSONB NOT NULL,
    "weight" REAL NOT NULL,
    "controversial" BOOLEAN NOT NULL DEFAULT false,
    "studyId" TEXT,
    "collectionId" TEXT,
    "extractedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractionModel" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "theme_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "themeId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT NOT NULL,
    "sourceAuthor" TEXT,
    "influence" REAL NOT NULL,
    "keywordMatches" INTEGER NOT NULL,
    "excerpts" JSONB NOT NULL,
    "timestamps" JSONB,
    "doi" TEXT,
    "authors" JSONB,
    "year" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "theme_sources_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "unified_themes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "theme_provenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "themeId" TEXT NOT NULL,
    "paperInfluence" REAL NOT NULL DEFAULT 0.0,
    "videoInfluence" REAL NOT NULL DEFAULT 0.0,
    "podcastInfluence" REAL NOT NULL DEFAULT 0.0,
    "socialInfluence" REAL NOT NULL DEFAULT 0.0,
    "paperCount" INTEGER NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "podcastCount" INTEGER NOT NULL DEFAULT 0,
    "socialCount" INTEGER NOT NULL DEFAULT 0,
    "averageConfidence" REAL NOT NULL,
    "citationChain" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "theme_provenance_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "unified_themes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "unified_themes_studyId_idx" ON "unified_themes"("studyId");

-- CreateIndex
CREATE INDEX "unified_themes_collectionId_idx" ON "unified_themes"("collectionId");

-- CreateIndex
CREATE INDEX "unified_themes_weight_idx" ON "unified_themes"("weight");

-- CreateIndex
CREATE INDEX "theme_sources_themeId_idx" ON "theme_sources"("themeId");

-- CreateIndex
CREATE INDEX "theme_sources_sourceType_idx" ON "theme_sources"("sourceType");

-- CreateIndex
CREATE INDEX "theme_sources_sourceId_idx" ON "theme_sources"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "theme_provenance_themeId_key" ON "theme_provenance"("themeId");
