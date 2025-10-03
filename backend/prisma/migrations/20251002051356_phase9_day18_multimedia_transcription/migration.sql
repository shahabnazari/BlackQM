-- CreateTable
CREATE TABLE "video_transcripts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "duration" INTEGER NOT NULL,
    "transcript" TEXT NOT NULL,
    "timestampedText" JSONB NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "confidence" REAL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transcriptionCost" REAL,
    "analysisCost" REAL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transcript_themes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transcriptId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL,
    "timestamps" JSONB NOT NULL,
    "keywords" JSONB NOT NULL,
    "summary" TEXT,
    "quotes" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transcript_themes_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "video_transcripts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "multimedia_citations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transcriptId" TEXT NOT NULL,
    "citedWork" TEXT NOT NULL,
    "citationType" TEXT NOT NULL DEFAULT 'mention',
    "timestamp" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "parsedCitation" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "multimedia_citations_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "video_transcripts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_media_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "author" TEXT NOT NULL,
    "authorId" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "views" INTEGER,
    "likes" INTEGER,
    "shares" INTEGER,
    "comments" INTEGER,
    "transcriptId" TEXT,
    "hashtags" JSONB,
    "trends" JSONB,
    "relevanceScore" REAL,
    "researchThemes" JSONB,
    "uploadMethod" TEXT NOT NULL DEFAULT 'api',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_media_content_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "video_transcripts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "video_transcripts_sourceType_idx" ON "video_transcripts"("sourceType");

-- CreateIndex
CREATE INDEX "video_transcripts_processedAt_idx" ON "video_transcripts"("processedAt");

-- CreateIndex
CREATE INDEX "video_transcripts_sourceUrl_idx" ON "video_transcripts"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "video_transcripts_sourceId_sourceType_key" ON "video_transcripts"("sourceId", "sourceType");

-- CreateIndex
CREATE INDEX "transcript_themes_transcriptId_idx" ON "transcript_themes"("transcriptId");

-- CreateIndex
CREATE INDEX "transcript_themes_theme_idx" ON "transcript_themes"("theme");

-- CreateIndex
CREATE INDEX "multimedia_citations_transcriptId_idx" ON "multimedia_citations"("transcriptId");

-- CreateIndex
CREATE INDEX "multimedia_citations_citedWork_idx" ON "multimedia_citations"("citedWork");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_content_url_key" ON "social_media_content"("url");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_content_transcriptId_key" ON "social_media_content"("transcriptId");

-- CreateIndex
CREATE INDEX "social_media_content_platform_idx" ON "social_media_content"("platform");

-- CreateIndex
CREATE INDEX "social_media_content_publishedAt_idx" ON "social_media_content"("publishedAt");

-- CreateIndex
CREATE INDEX "social_media_content_relevanceScore_idx" ON "social_media_content"("relevanceScore");

-- CreateIndex
CREATE INDEX "social_media_content_author_idx" ON "social_media_content"("author");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_content_platform_platformId_key" ON "social_media_content"("platform", "platformId");
