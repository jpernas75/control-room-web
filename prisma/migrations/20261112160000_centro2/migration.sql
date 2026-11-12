ALTER TABLE "Linea" ADD COLUMN "centro2" TEXT NOT NULL DEFAULT '';

-- Talleres exteriores del export de ICSS del 12/11/2026. No se toca una reasignación manual.
UPDATE "Linea"
SET "centro2" = 'Duro e Hijos', "centroId" = NULL
WHERE "expedienteId" = '8002643968' AND "centroManual" = false AND "centro2" = '';

UPDATE "Linea"
SET "centro2" = 'La Junquera', "centroId" = NULL
WHERE "expedienteId" IN ('8002638703', '8002610460', '8002588657', '8002583193')
  AND "centroManual" = false AND "centro2" = '';
