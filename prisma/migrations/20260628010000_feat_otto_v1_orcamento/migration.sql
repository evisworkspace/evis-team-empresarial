-- AlterTable
ALTER TABLE "projeto_item_orcamento"
ADD COLUMN     "fornecedor_id" UUID,
ADD COLUMN     "status_item" VARCHAR(20);

-- CreateTable
CREATE TABLE "projeto_config" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "bdi_padrao_p" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "bdi_padrao_s" DECIMAL(10,2) NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projeto_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otto_sessao" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "estado" VARCHAR(40) NOT NULL DEFAULT 'rascunho',
    "leitura_tecnica" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "otto_sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otto_documento" (
    "id" UUID NOT NULL,
    "sessao_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "titulo" VARCHAR(300) NOT NULL,
    "conteudo" TEXT,
    "url" VARCHAR(2000),
    "legibilidade" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "otto_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otto_decisao" (
    "id" UUID NOT NULL,
    "sessao_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "pergunta" TEXT NOT NULL,
    "resposta" TEXT,
    "impacto" VARCHAR(200),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "posicao" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondida_em" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "otto_decisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otto_item_eap" (
    "id" UUID NOT NULL,
    "sessao_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "parent_id" UUID,
    "posicao" INTEGER NOT NULL DEFAULT 0,
    "nivel_eap" INTEGER NOT NULL DEFAULT 1,
    "nome" VARCHAR(300) NOT NULL,
    "descricao" TEXT,
    "unidade" VARCHAR(20),
    "quantidade" DECIMAL(15,4),
    "status_escopo" VARCHAR(20),
    "natureza" VARCHAR(30),
    "confianca" VARCHAR(10),
    "fonte" VARCHAR(300),
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "exportado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "otto_item_eap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projeto_item_orcamento_fornecedor_id_idx" ON "projeto_item_orcamento"("fornecedor_id");

-- CreateIndex
CREATE INDEX "projeto_item_orcamento_status_item_idx" ON "projeto_item_orcamento"("status_item");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_config_projeto_id_key" ON "projeto_config"("projeto_id");

-- CreateIndex
CREATE INDEX "projeto_config_empresa_id_idx" ON "projeto_config"("empresa_id");

-- CreateIndex
CREATE INDEX "otto_sessao_projeto_id_idx" ON "otto_sessao"("projeto_id");

-- CreateIndex
CREATE INDEX "otto_sessao_empresa_id_idx" ON "otto_sessao"("empresa_id");

-- CreateIndex
CREATE INDEX "otto_sessao_estado_idx" ON "otto_sessao"("estado");

-- CreateIndex
CREATE INDEX "otto_documento_sessao_id_idx" ON "otto_documento"("sessao_id");

-- CreateIndex
CREATE INDEX "otto_documento_empresa_id_idx" ON "otto_documento"("empresa_id");

-- CreateIndex
CREATE INDEX "otto_decisao_sessao_id_idx" ON "otto_decisao"("sessao_id");

-- CreateIndex
CREATE INDEX "otto_decisao_empresa_id_idx" ON "otto_decisao"("empresa_id");

-- CreateIndex
CREATE INDEX "otto_decisao_status_idx" ON "otto_decisao"("status");

-- CreateIndex
CREATE INDEX "otto_item_eap_sessao_id_idx" ON "otto_item_eap"("sessao_id");

-- CreateIndex
CREATE INDEX "otto_item_eap_empresa_id_idx" ON "otto_item_eap"("empresa_id");

-- CreateIndex
CREATE INDEX "otto_item_eap_parent_id_idx" ON "otto_item_eap"("parent_id");

-- CreateIndex
CREATE INDEX "otto_item_eap_nivel_eap_idx" ON "otto_item_eap"("nivel_eap");

-- CreateIndex
CREATE INDEX "otto_item_eap_aprovado_idx" ON "otto_item_eap"("aprovado");

-- AddForeignKey
ALTER TABLE "projeto_item_orcamento" ADD CONSTRAINT "projeto_item_orcamento_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_config" ADD CONSTRAINT "projeto_config_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_config" ADD CONSTRAINT "projeto_config_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_sessao" ADD CONSTRAINT "otto_sessao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_sessao" ADD CONSTRAINT "otto_sessao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_documento" ADD CONSTRAINT "otto_documento_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "otto_sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_documento" ADD CONSTRAINT "otto_documento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_decisao" ADD CONSTRAINT "otto_decisao_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "otto_sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_decisao" ADD CONSTRAINT "otto_decisao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_item_eap" ADD CONSTRAINT "otto_item_eap_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "otto_sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_item_eap" ADD CONSTRAINT "otto_item_eap_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otto_item_eap" ADD CONSTRAINT "otto_item_eap_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "otto_item_eap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
