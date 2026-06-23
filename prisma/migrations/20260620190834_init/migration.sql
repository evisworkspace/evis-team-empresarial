-- CreateTable
CREATE TABLE "empresa" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo_pessoa" TEXT NOT NULL,
    "documento" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "auth_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "tipo_pessoa" TEXT,
    "origem_contato" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "numero_obra" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "stage" TEXT NOT NULL,
    "status_interno" TEXT NOT NULL,
    "origem" TEXT,
    "data_inicio_estimada" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_item_orcamento" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL(15,3),
    "unidade" TEXT,
    "preco_estimado" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projeto_item_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedor" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefa" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data_prevista" DATE,
    "responsavel_usuario_id" UUID,
    "responsavel_fornecedor_id" UUID,
    "origem" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamento_financeiro" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "fornecedor_id" UUID,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "data_vencimento" DATE NOT NULL,
    "data_realizacao" DATE,
    "descricao" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lancamento_financeiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rastreio_auditoria" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "projeto_id" UUID,
    "entidade_afetada_tipo" TEXT NOT NULL,
    "entidade_afetada_id" UUID NOT NULL,
    "evento_tipo" TEXT NOT NULL,
    "usuario_id" UUID,
    "conteudo_sugerido_ia" JSONB,
    "conteudo_persistido" JSONB NOT NULL,
    "origem_informacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rastreio_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "empresa_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_auth_user_id_key" ON "usuario"("auth_user_id");

-- CreateIndex
CREATE INDEX "usuario_empresa_id_idx" ON "usuario"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_empresa_id_email_key" ON "usuario"("empresa_id", "email");

-- CreateIndex
CREATE INDEX "cliente_empresa_id_idx" ON "cliente"("empresa_id");

-- CreateIndex
CREATE INDEX "projeto_empresa_id_stage_status_interno_idx" ON "projeto"("empresa_id", "stage", "status_interno");

-- CreateIndex
CREATE INDEX "projeto_cliente_id_idx" ON "projeto"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_empresa_id_numero_obra_key" ON "projeto"("empresa_id", "numero_obra");

-- CreateIndex
CREATE INDEX "projeto_item_orcamento_empresa_id_idx" ON "projeto_item_orcamento"("empresa_id");

-- CreateIndex
CREATE INDEX "projeto_item_orcamento_projeto_id_idx" ON "projeto_item_orcamento"("projeto_id");

-- CreateIndex
CREATE INDEX "fornecedor_empresa_id_idx" ON "fornecedor"("empresa_id");

-- CreateIndex
CREATE INDEX "tarefa_projeto_id_status_idx" ON "tarefa"("projeto_id", "status");

-- CreateIndex
CREATE INDEX "tarefa_empresa_id_idx" ON "tarefa"("empresa_id");

-- CreateIndex
CREATE INDEX "tarefa_responsavel_usuario_id_idx" ON "tarefa"("responsavel_usuario_id");

-- CreateIndex
CREATE INDEX "tarefa_responsavel_fornecedor_id_idx" ON "tarefa"("responsavel_fornecedor_id");

-- CreateIndex
CREATE INDEX "lancamento_financeiro_projeto_id_status_idx" ON "lancamento_financeiro"("projeto_id", "status");

-- CreateIndex
CREATE INDEX "lancamento_financeiro_empresa_id_idx" ON "lancamento_financeiro"("empresa_id");

-- CreateIndex
CREATE INDEX "lancamento_financeiro_fornecedor_id_idx" ON "lancamento_financeiro"("fornecedor_id");

-- CreateIndex
CREATE INDEX "rastreio_auditoria_entidade_afetada_tipo_entidade_afetada_i_idx" ON "rastreio_auditoria"("entidade_afetada_tipo", "entidade_afetada_id", "created_at");

-- CreateIndex
CREATE INDEX "rastreio_auditoria_empresa_id_projeto_id_created_at_idx" ON "rastreio_auditoria"("empresa_id", "projeto_id", "created_at");

-- CreateIndex
CREATE INDEX "rastreio_auditoria_usuario_id_idx" ON "rastreio_auditoria"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_empresa_id_idx" ON "users"("empresa_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_item_orcamento" ADD CONSTRAINT "projeto_item_orcamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_item_orcamento" ADD CONSTRAINT "projeto_item_orcamento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedor" ADD CONSTRAINT "fornecedor_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_responsavel_usuario_id_fkey" FOREIGN KEY ("responsavel_usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_responsavel_fornecedor_id_fkey" FOREIGN KEY ("responsavel_fornecedor_id") REFERENCES "fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rastreio_auditoria" ADD CONSTRAINT "rastreio_auditoria_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rastreio_auditoria" ADD CONSTRAINT "rastreio_auditoria_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rastreio_auditoria" ADD CONSTRAINT "rastreio_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
