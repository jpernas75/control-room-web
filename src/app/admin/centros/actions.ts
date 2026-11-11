"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { USUARIO_CENTRO } from "@/domain/centros";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

export async function guardarClave(formData: FormData) {
  const sesion = await sesionActual();
  if (sesion?.role !== "ADMIN") return;
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!USUARIO_CENTRO[username] || password.length < 8) return;
  await prisma.user.update({
    where: { username },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/admin/centros");
}
