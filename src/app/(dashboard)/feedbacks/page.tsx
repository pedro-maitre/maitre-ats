import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FeedbackLibraryViewer from "@/components/feedback/FeedbackLibraryViewer";

export const metadata = {
  title: "Central de Feedbacks & WhatsApp | Conecta Talentos",
  description: "Manual e Biblioteca com 23 Modelos Oficiais de Feedback para Processos Seletivos via WhatsApp",
};

export default async function FeedbacksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <FeedbackLibraryViewer />;
}
