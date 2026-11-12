CREATE TABLE "Acceso" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Acceso_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Acceso_createdAt_idx" ON "Acceso"("createdAt");
CREATE INDEX "Acceso_userId_idx" ON "Acceso"("userId");

ALTER TABLE "Acceso" ADD CONSTRAINT "Acceso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
