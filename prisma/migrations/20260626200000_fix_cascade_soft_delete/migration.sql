-- Limpar registros órfãos: soft-delete em filhos de projetos já deletados
-- Executado uma única vez para corrigir estado inconsistente

UPDATE "tarefa"
SET "deleted_at" = NOW()
WHERE "projeto_id" IN (SELECT "id" FROM "projeto" WHERE "deleted_at" IS NOT NULL)
  AND "deleted_at" IS NULL;

UPDATE "lancamento_financeiro"
SET "deleted_at" = NOW()
WHERE "projeto_id" IN (SELECT "id" FROM "projeto" WHERE "deleted_at" IS NOT NULL)
  AND "deleted_at" IS NULL;

UPDATE "anotacao"
SET "deleted_at" = NOW()
WHERE "projeto_id" IN (SELECT "id" FROM "projeto" WHERE "deleted_at" IS NOT NULL)
  AND "deleted_at" IS NULL;

UPDATE "projeto_item_orcamento"
SET "deleted_at" = NOW()
WHERE "projeto_id" IN (SELECT "id" FROM "projeto" WHERE "deleted_at" IS NOT NULL)
  AND "deleted_at" IS NULL;
