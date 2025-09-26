-- CreateTable
CREATE TABLE "papers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "authors" JSONB NOT NULL,
    "year" INTEGER NOT NULL,
    "abstract" TEXT,
    "doi" TEXT,
    "url" TEXT,
    "venue" TEXT,
    "citationCount" INTEGER,
    "keywords" JSONB,
    "fieldsOfStudy" JSONB,
    "references" JSONB,
    "citations" JSONB,
    "source" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tags" JSONB,
    "notes" TEXT,
    "collectionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "papers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "papers_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "paper_collections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "paper_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "paper_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "paper_themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "relevanceScore" REAL NOT NULL,
    "emergenceYear" INTEGER,
    "trendDirection" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "research_gaps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "opportunityScore" REAL NOT NULL,
    "suggestedMethods" JSONB NOT NULL,
    "potentialImpact" TEXT NOT NULL,
    "fundingOpportunities" JSONB,
    "collaborators" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "research_gaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PaperToPaperTheme" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PaperToPaperTheme_A_fkey" FOREIGN KEY ("A") REFERENCES "papers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PaperToPaperTheme_B_fkey" FOREIGN KEY ("B") REFERENCES "paper_themes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PaperToResearchGap" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PaperToResearchGap_A_fkey" FOREIGN KEY ("A") REFERENCES "papers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PaperToResearchGap_B_fkey" FOREIGN KEY ("B") REFERENCES "research_gaps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "papers_userId_idx" ON "papers"("userId");

-- CreateIndex
CREATE INDEX "papers_doi_idx" ON "papers"("doi");

-- CreateIndex
CREATE INDEX "papers_collectionId_idx" ON "papers"("collectionId");

-- CreateIndex
CREATE INDEX "paper_collections_userId_idx" ON "paper_collections"("userId");

-- CreateIndex
CREATE INDEX "research_gaps_userId_idx" ON "research_gaps"("userId");

-- CreateIndex
CREATE INDEX "search_logs_userId_idx" ON "search_logs"("userId");

-- CreateIndex
CREATE INDEX "search_logs_timestamp_idx" ON "search_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "_PaperToPaperTheme_AB_unique" ON "_PaperToPaperTheme"("A", "B");

-- CreateIndex
CREATE INDEX "_PaperToPaperTheme_B_index" ON "_PaperToPaperTheme"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PaperToResearchGap_AB_unique" ON "_PaperToResearchGap"("A", "B");

-- CreateIndex
CREATE INDEX "_PaperToResearchGap_B_index" ON "_PaperToResearchGap"("B");
