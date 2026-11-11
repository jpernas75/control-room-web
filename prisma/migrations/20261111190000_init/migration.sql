-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CENTRO');

-- CreateEnum
CREATE TYPE "Origen" AS ENUM ('PREVENTIVO', 'CONTROL_ROOM');

-- CreateEnum
CREATE TYPE "Presencia" AS ENUM ('ACTIVA', 'DESHABILITADA', 'ALERTA');

-- CreateEnum
CREATE TYPE "TipoImport" AS ENUM ('JSON', 'EXCEL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "centroId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Centro" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Centro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Linea" (
    "id" TEXT NOT NULL,
    "origen" "Origen" NOT NULL,
    "presencia" "Presencia" NOT NULL DEFAULT 'ACTIVA',
    "expedienteId" TEXT,
    "vin" TEXT NOT NULL DEFAULT '',
    "centroId" TEXT,
    "centroManual" BOOLEAN NOT NULL DEFAULT false,
    "cliente" TEXT NOT NULL DEFAULT '',
    "matricula" TEXT NOT NULL DEFAULT '',
    "modelo" TEXT NOT NULL DEFAULT '',
    "km" TEXT NOT NULL DEFAULT '',
    "prediagnostico" TEXT NOT NULL DEFAULT '',
    "fase" TEXT NOT NULL DEFAULT '',
    "estadoIcss" TEXT NOT NULL DEFAULT '',
    "fechaIso" TEXT NOT NULL DEFAULT '',
    "abierto" BOOLEAN NOT NULL DEFAULT false,
    "pago" TEXT NOT NULL DEFAULT '',
    "cuenta" TEXT NOT NULL DEFAULT '',
    "vco" BOOLEAN NOT NULL DEFAULT false,
    "orId" TEXT NOT NULL DEFAULT '',
    "orNumero" TEXT NOT NULL DEFAULT '',
    "orEstado" TEXT NOT NULL DEFAULT '',
    "orUrl" TEXT NOT NULL DEFAULT '',
    "orFecha" TEXT NOT NULL DEFAULT '',
    "orFechaCita" TEXT NOT NULL DEFAULT '',
    "orFechaEntrega" TEXT NOT NULL DEFAULT '',
    "orCita" BOOLEAN NOT NULL DEFAULT false,
    "trigger" TEXT NOT NULL DEFAULT '',
    "obs" TEXT NOT NULL DEFAULT '',
    "dealer" TEXT NOT NULL DEFAULT '',
    "comentario" TEXT NOT NULL DEFAULT '',
    "comentarioUserId" TEXT,
    "comentarioAt" TIMESTAMP(3),
    "fechaPrevista" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Linea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CambioCentro" (
    "id" TEXT NOT NULL,
    "lineaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "desde" TEXT NOT NULL,
    "hacia" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CambioCentro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "tipo" "TipoImport" NOT NULL,
    "resumen" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Centro_nombre_key" ON "Centro"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Centro_slug_key" ON "Centro"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Linea_expedienteId_key" ON "Linea"("expedienteId");

-- CreateIndex
CREATE INDEX "Linea_vin_idx" ON "Linea"("vin");

-- CreateIndex
CREATE INDEX "Linea_centroId_origen_idx" ON "Linea"("centroId", "origen");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_centroId_fkey" FOREIGN KEY ("centroId") REFERENCES "Centro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linea" ADD CONSTRAINT "Linea_centroId_fkey" FOREIGN KEY ("centroId") REFERENCES "Centro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Linea" ADD CONSTRAINT "Linea_comentarioUserId_fkey" FOREIGN KEY ("comentarioUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioCentro" ADD CONSTRAINT "CambioCentro_lineaId_fkey" FOREIGN KEY ("lineaId") REFERENCES "Linea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioCentro" ADD CONSTRAINT "CambioCentro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
