-- CreateTable
CREATE TABLE "item_biblioteca" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" VARCHAR(50),
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(30) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "preco_unitario" DECIMAL(15,4),
    "unidade_id" UUID,
    "grupo_id" UUID,
    "categoria_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "item_biblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_biblioteca_empresa_id_idx" ON "item_biblioteca"("empresa_id");

-- CreateIndex
CREATE INDEX "item_biblioteca_tipo_idx" ON "item_biblioteca"("tipo");

-- AddForeignKey
ALTER TABLE "item_biblioteca" ADD CONSTRAINT "item_biblioteca_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidade_medida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_biblioteca" ADD CONSTRAINT "item_biblioteca_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupo_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_biblioteca" ADD CONSTRAINT "item_biblioteca_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_biblioteca" ADD CONSTRAINT "item_biblioteca_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
