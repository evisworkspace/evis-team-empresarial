-- AlterTable
ALTER TABLE "cliente" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "cpf_cnpj" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "razao_social" TEXT,
ADD COLUMN     "rua" TEXT;

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "bairro_obra" TEXT,
ADD COLUMN     "cep_obra" TEXT,
ADD COLUMN     "cidade_obra" TEXT,
ADD COLUMN     "complemento_obra" TEXT,
ADD COLUMN     "data_de_ganho" DATE,
ADD COLUMN     "estado_obra" TEXT,
ADD COLUMN     "logradouro_obra" TEXT,
ADD COLUMN     "numero_endereco_obra" TEXT;
