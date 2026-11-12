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

  await crearAdminSiFalta("admin", "Administrador", process.env.SEED_ADMIN_PASSWORD, true);
  await crearAdminSiFalta("agustin", "Agustin", process.env.SEED_AGUSTIN_PASSWORD, false);
  await crearAdminSiFalta("mar", "Mar", process.env.SEED_MAR_PASSWORD, false);
}

async function crearAdminSiFalta(username: string, name: string, password: string | undefined, obligatorio: boolean) {
  const existe = await prisma.user.findUnique({ where: { username } });
  if (existe) return;
  if (!password) {
    if (obligatorio) throw new Error(`Falta la clave para crear ${username}`);
    console.warn(`No se crea ${username}: falta su clave de arranque`);
    return;
  }
  await prisma.user.create({
    data: {
      username,
      name,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
