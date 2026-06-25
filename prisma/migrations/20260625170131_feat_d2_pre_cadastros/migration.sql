-- CreateTable
CREATE TABLE "grupo_item" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "grupo_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_item" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categoria_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidade_medida" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "unidade_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_financeira" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "grupo_dre" TEXT,
    "parent_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categoria_financeira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centro_de_custo" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "centro_de_custo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grupo_item_empresa_id_idx" ON "grupo_item"("empresa_id");

-- CreateIndex
CREATE INDEX "categoria_item_empresa_id_idx" ON "categoria_item"("empresa_id");

-- CreateIndex
CREATE INDEX "unidade_medida_empresa_id_idx" ON "unidade_medida"("empresa_id");

-- CreateIndex
CREATE INDEX "categoria_financeira_empresa_id_idx" ON "categoria_financeira"("empresa_id");

-- CreateIndex
CREATE INDEX "categoria_financeira_parent_id_idx" ON "categoria_financeira"("parent_id");

-- CreateIndex
CREATE INDEX "centro_de_custo_empresa_id_idx" ON "centro_de_custo"("empresa_id");

-- AddForeignKey
ALTER TABLE "grupo_item" ADD CONSTRAINT "grupo_item_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_item" ADD CONSTRAINT "categoria_item_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidade_medida" ADD CONSTRAINT "unidade_medida_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_financeira" ADD CONSTRAINT "categoria_financeira_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_financeira" ADD CONSTRAINT "categoria_financeira_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categoria_financeira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centro_de_custo" ADD CONSTRAINT "centro_de_custo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
