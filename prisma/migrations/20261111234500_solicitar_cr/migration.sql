ALTER TABLE "Linea" ADD COLUMN "solicitarCr" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Linea" SET "solicitarCr" = true WHERE "fechaPrevista" IS NOT NULL AND "fechaPrevista" <> '';
