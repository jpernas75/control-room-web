import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Control Room",
  description: "Control Room y preventivos VCO por delegación",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="px-4 py-4 text-center text-xs leading-relaxed text-slate-500">
          Está prohibido distribuir el usuario y la contraseña. La página no se actualiza automáticamente: los cambios en CAR o ICSS pueden tardar 1 día en verse reflejados.
        </footer>
      </body>
    </html>
  );
}
