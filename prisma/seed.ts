import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { CENTROS, nombreCuenta, USUARIO_CENTRO } from "../src/domain/centros";

const prisma = new PrismaClient();

async function main() {
  const centros = new Map<string, string>();
  for (const nombre of CENTROS) {
    const slug = Object.entries(USUARIO_CENTRO).find(([, n]) => n === nombre)?.[0];
    if (!slug) throw new Error(nombre);
    const centro = await prisma.centro.upsert({
      where: { slug },
      update: { nombre },
      create: { nombre, slug },
    });
    centros.set(slug, centro.id);
    await prisma.user.upsert({
      where: { username: slug },
      update: { name: nombreCuenta(nombre), role: "CENTRO", centroId: centro.id },
      create: { username: slug, name: nombreCuenta(nombre), role: "CENTRO", centroId: centro.id },
    });
  }

  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!admin) {
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password) throw new Error("Falta SEED_ADMIN_PASSWORD para crear el administrador");
    await prisma.user.create({
      data: {
        username: "admin",
        name: "Administrador",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
