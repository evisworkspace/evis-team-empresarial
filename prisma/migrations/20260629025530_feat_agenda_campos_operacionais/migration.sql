-- AlterTable
ALTER TABLE "agenda_item" ADD COLUMN     "dia_inteiro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "localizacao" VARCHAR(500),
ADD COLUMN     "participantes" VARCHAR(1000);
