import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maître ATS",
  description: "Enterprise Applicant Tracking System by Maître Consultoria",
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
      </body>
    </html>
  );
}
