ALTER TABLE "Linea" ADD COLUMN "esNuevo" BOOLEAN NOT NULL DEFAULT false;

-- Filas creadas en la última importación de cada origen. Las actualizadas conservan su fecha de alta.
UPDATE "Linea" AS l
SET "esNuevo" = true
WHERE l."origen" = 'CONTROL_ROOM'
  AND EXISTS (SELECT 1 FROM "ImportBatch" b WHERE b."tipo" = 'JSON')
  AND l."createdAt" <= (SELECT b."createdAt" FROM "ImportBatch" b WHERE b."tipo" = 'JSON' ORDER BY b."createdAt" DESC LIMIT 1)
  AND l."createdAt" > COALESCE(
    (SELECT b."createdAt" FROM "ImportBatch" b WHERE b."tipo" = 'JSON' ORDER BY b."createdAt" DESC OFFSET 1 LIMIT 1),
    '-infinity'::timestamp
  );

UPDATE "Linea" AS l
SET "esNuevo" = true
WHERE l."origen" = 'PREVENTIVO'
  AND EXISTS (SELECT 1 FROM "ImportBatch" b WHERE b."tipo" = 'EXCEL')
  AND l."createdAt" <= (SELECT b."createdAt" FROM "ImportBatch" b WHERE b."tipo" = 'EXCEL' ORDER BY b."createdAt" DESC LIMIT 1)
  AND l."createdAt" > COALESCE(
    (SELECT b."createdAt" FROM "ImportBatch" b WHERE b."tipo" = 'EXCEL' ORDER BY b."createdAt" DESC OFFSET 1 LIMIT 1),
    '-infinity'::timestamp
  );
