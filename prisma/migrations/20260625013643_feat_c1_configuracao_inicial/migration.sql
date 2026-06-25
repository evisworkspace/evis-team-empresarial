-- AlterTable
ALTER TABLE "empresa" ADD COLUMN     "celular" TEXT,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "is_whatsapp" BOOLEAN DEFAULT false,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "razao_social" TEXT,
ADD COLUMN     "tipo_empresa" TEXT;

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "foto" TEXT,
ADD COLUMN     "telefone" TEXT;

-- CreateTable
CREATE TABLE "convite_equipe" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convite_equipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convite_equipe_token_key" ON "convite_equipe"("token");

-- CreateIndex
CREATE INDEX "convite_equipe_empresa_id_idx" ON "convite_equipe"("empresa_id");

-- AddForeignKey
ALTER TABLE "convite_equipe" ADD CONSTRAINT "convite_equipe_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
