-- CreateTable
CREATE TABLE "status_projeto" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "stage" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6b7280',
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_projeto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "status_projeto_empresa_id_stage_ordem_idx" ON "status_projeto"("empresa_id", "stage", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "status_projeto_empresa_id_stage_slug_key" ON "status_projeto"("empresa_id", "stage", "slug");

-- AddForeignKey
ALTER TABLE "status_projeto" ADD CONSTRAINT "status_projeto_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
