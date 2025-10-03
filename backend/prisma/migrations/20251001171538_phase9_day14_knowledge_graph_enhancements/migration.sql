-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_knowledge_edges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "metadata" JSONB,
    "influenceFlow" REAL,
    "controversyType" TEXT,
    "isPredicted" BOOLEAN NOT NULL DEFAULT false,
    "predictionScore" REAL,
    "temporalWeight" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "knowledge_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "knowledge_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "knowledge_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_edges" ("createdAt", "fromNodeId", "id", "metadata", "strength", "toNodeId", "type") SELECT "createdAt", "fromNodeId", "id", "metadata", "strength", "toNodeId", "type" FROM "knowledge_edges";
DROP TABLE "knowledge_edges";
ALTER TABLE "new_knowledge_edges" RENAME TO "knowledge_edges";
CREATE INDEX "knowledge_edges_fromNodeId_idx" ON "knowledge_edges"("fromNodeId");
CREATE INDEX "knowledge_edges_toNodeId_idx" ON "knowledge_edges"("toNodeId");
CREATE INDEX "knowledge_edges_type_idx" ON "knowledge_edges"("type");
CREATE INDEX "knowledge_edges_isPredicted_idx" ON "knowledge_edges"("isPredicted");
CREATE UNIQUE INDEX "knowledge_edges_fromNodeId_toNodeId_type_key" ON "knowledge_edges"("fromNodeId", "toNodeId", "type");
CREATE TABLE "new_knowledge_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sourceStudyId" TEXT,
    "sourcePaperId" TEXT,
    "confidence" REAL DEFAULT 0.5,
    "metadata" JSONB,
    "isBridgeConcept" BOOLEAN NOT NULL DEFAULT false,
    "controversyScore" REAL,
    "influenceScore" REAL,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "trendingScore" REAL,
    "keywords" JSONB DEFAULT [],
    "predictedImpact" REAL,
    "emergingTopic" BOOLEAN NOT NULL DEFAULT false,
    "fundingPotential" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_knowledge_nodes" ("confidence", "createdAt", "description", "id", "label", "metadata", "sourcePaperId", "sourceStudyId", "type", "updatedAt") SELECT "confidence", "createdAt", "description", "id", "label", "metadata", "sourcePaperId", "sourceStudyId", "type", "updatedAt" FROM "knowledge_nodes";
DROP TABLE "knowledge_nodes";
ALTER TABLE "new_knowledge_nodes" RENAME TO "knowledge_nodes";
CREATE INDEX "knowledge_nodes_type_idx" ON "knowledge_nodes"("type");
CREATE INDEX "knowledge_nodes_sourceStudyId_idx" ON "knowledge_nodes"("sourceStudyId");
CREATE INDEX "knowledge_nodes_sourcePaperId_idx" ON "knowledge_nodes"("sourcePaperId");
CREATE INDEX "knowledge_nodes_isBridgeConcept_idx" ON "knowledge_nodes"("isBridgeConcept");
CREATE INDEX "knowledge_nodes_emergingTopic_idx" ON "knowledge_nodes"("emergingTopic");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
