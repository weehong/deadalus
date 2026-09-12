-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storeys" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "storeyId" TEXT NOT NULL,
    "unitTypeId" TEXT,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_types" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeKey" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_nameKey_key" ON "projects"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "blocks_projectId_position_id_idx" ON "blocks"("projectId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_projectId_nameKey_key" ON "blocks"("projectId", "nameKey");

-- CreateIndex
CREATE INDEX "storeys_blockId_position_id_idx" ON "storeys"("blockId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "storeys_blockId_nameKey_key" ON "storeys"("blockId", "nameKey");

-- CreateIndex
CREATE INDEX "units_storeyId_position_id_idx" ON "units"("storeyId", "position", "id");

-- CreateIndex
CREATE INDEX "units_unitTypeId_idx" ON "units"("unitTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "units_storeyId_nameKey_key" ON "units"("storeyId", "nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "unit_types_projectId_codeKey_key" ON "unit_types"("projectId", "codeKey");

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storeys" ADD CONSTRAINT "storeys_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_storeyId_fkey" FOREIGN KEY ("storeyId") REFERENCES "storeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_unitTypeId_fkey" FOREIGN KEY ("unitTypeId") REFERENCES "unit_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_types" ADD CONSTRAINT "unit_types_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

