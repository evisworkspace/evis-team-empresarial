-- AlterTable
ALTER TABLE "cliente" ADD COLUMN     "data_nascimento" TIMESTAMP(3),
ADD COLUMN     "rg" TEXT;

-- AlterTable
ALTER TABLE "fornecedor" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "categorias" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "cpf_cnpj" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "nome_contato" TEXT,
ADD COLUMN     "nome_responsavel" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "razao_social" TEXT,
ADD COLUMN     "rua" TEXT,
ADD COLUMN     "site" TEXT,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "tipo_pessoa" TEXT;
