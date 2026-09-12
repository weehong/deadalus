-- CreateEnum
CREATE TYPE "ProgressAuthorKind" AS ENUM ('administrator', 'member');

-- CreateTable
CREATE TABLE "catalogue_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "catalogueItemId" TEXT NOT NULL,
    "subcontractorId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "progression" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_entries" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "note" TEXT,
    "enteredByKind" "ProgressAuthorKind" NOT NULL,
    "enteredById" TEXT NOT NULL,
    "enteredByName" TEXT NOT NULL,
    "subcontractorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalogue_items_projectId_nameKey_key" ON "catalogue_items"("projectId", "nameKey");

-- CreateIndex
CREATE INDEX "items_catalogueItemId_idx" ON "items"("catalogueItemId");

-- CreateIndex
CREATE INDEX "items_subcontractorId_idx" ON "items"("subcontractorId");

-- CreateIndex
CREATE INDEX "items_unitId_idx" ON "items"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "items_unitId_catalogueItemId_key" ON "items"("unitId", "catalogueItemId");

-- CreateIndex
CREATE INDEX "progress_entries_itemId_createdAt_id_idx" ON "progress_entries"("itemId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "catalogue_items" ADD CONSTRAINT "catalogue_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_catalogueItemId_fkey" FOREIGN KEY ("catalogueItemId") REFERENCES "catalogue_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "subcontractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
