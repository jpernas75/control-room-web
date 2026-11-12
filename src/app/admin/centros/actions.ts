"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { esCuentaAdministrador } from "@/lib/sesion";

export async function guardarClave(formData: FormData) {
  if (!(await esCuentaAdministrador())) return;
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const usuario = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!usuario || password.length < 8) return;
  await prisma.user.update({
    where: { username },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/admin/centros");
}
