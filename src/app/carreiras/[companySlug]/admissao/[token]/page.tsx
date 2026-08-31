import React from "react";
import { notFound } from "next/navigation";
import { getAdmissionDetails } from "./actions";
import AdmissionPortalClient from "@/components/operations/AdmissionPortalClient";

interface AdmissionPageProps {
  params: Promise<{
    companySlug: string;
    token: string;
  }>;
}

export async function generateMetadata({ params }: AdmissionPageProps) {
  const { companySlug, token } = await params;
  const res = await getAdmissionDetails(companySlug, token);

  if (!res.success || !res.data) {
    return {
      title: "Admissão Digital | Maître Conecta",
    };
  }

  return {
    title: `Admissão Digital - ${res.data.candidateName} | ${res.data.companyName}`,
    description: `Envio de documentação e ficha cadastral para a vaga ${res.data.jobTitle}`,
  };
}

export default async function AdmissionPage({ params }: AdmissionPageProps) {
  const { companySlug, token } = await params;

  const res = await getAdmissionDetails(companySlug, token);

  if (!res.success || !res.data) {
    notFound();
  }

  return <AdmissionPortalClient initialData={res.data} token={token} />;
}
