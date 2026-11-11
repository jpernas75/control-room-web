import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  const logged = Boolean(req.auth);
  const isLogin = pathname.startsWith("/login");
  if (!logged && !isLogin) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (logged && isLogin) return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  if ((pathname.startsWith("/admin") || pathname.startsWith("/importar")) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
