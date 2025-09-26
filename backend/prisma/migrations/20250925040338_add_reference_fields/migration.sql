-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_papers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "authors" JSONB NOT NULL,
    "year" INTEGER NOT NULL,
    "abstract" TEXT,
    "journal" TEXT,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
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
    "pdfPath" TEXT,
    "hasFullText" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "papers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "papers_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "paper_collections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_papers" ("abstract", "authors", "citationCount", "citations", "collectionId", "createdAt", "doi", "fieldsOfStudy", "id", "keywords", "notes", "references", "source", "tags", "title", "updatedAt", "url", "userId", "venue", "year") SELECT "abstract", "authors", "citationCount", "citations", "collectionId", "createdAt", "doi", "fieldsOfStudy", "id", "keywords", "notes", "references", "source", "tags", "title", "updatedAt", "url", "userId", "venue", "year" FROM "papers";
DROP TABLE "papers";
ALTER TABLE "new_papers" RENAME TO "papers";
CREATE INDEX "papers_userId_idx" ON "papers"("userId");
CREATE INDEX "papers_doi_idx" ON "papers"("doi");
CREATE INDEX "papers_collectionId_idx" ON "papers"("collectionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
