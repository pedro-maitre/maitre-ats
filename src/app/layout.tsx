import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://maitreconecta.vercel.app"),
  title: "Maître Conecta — Suíte Integrada de RH & Talentos",
  description: "Plataforma Inteligente de Recrutamento, Core HR e Conexão de Talentos da Maître Consultoria",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={outfit.className}>
        <AuthProvider>{children}</AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
