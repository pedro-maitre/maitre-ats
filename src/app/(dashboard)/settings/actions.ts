"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: { name: string; email: string }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: formData.email }
  });

  if (existingUser && existingUser.id !== session.user.id) {
    throw new Error("Este e-mail já está em uso por outro usuário.");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: formData.name,
      email: formData.email,
    }
  });

  revalidatePath("/settings/profile");
  return { success: true };
}

export type UpdateOrganizationInput = {
  name: string;
  slug: string;
  legalName?: string | null;
  cnpj?: string | null;
  industry?: string | null;
  companySize?: string | null;
  foundedYear?: number | null;
  email?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  addressZipCode?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  aboutUs?: string | null;
  cultureValues?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
};

export async function updateOrganization(formData: UpdateOrganizationInput) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true }
  });

  if (!user?.organizationId) {
    throw new Error("Usuário não vinculado a uma organização.");
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem alterar os dados da empresa.");
  }

  // Check slug uniqueness
  const cleanSlug = formData.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/\s+/g, "-");

  const existingOrg = await prisma.organization.findUnique({
    where: { slug: cleanSlug }
  });

  if (existingOrg && existingOrg.id !== user.organizationId) {
    throw new Error("Esta URL (slug) já está sendo utilizada por outra empresa.");
  }

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      name: formData.name.trim(),
      slug: cleanSlug,
      legalName: formData.legalName?.trim() || null,
      cnpj: formData.cnpj?.trim() || null,
      industry: formData.industry?.trim() || null,
      companySize: formData.companySize?.trim() || null,
      foundedYear: formData.foundedYear ? Number(formData.foundedYear) : null,
      email: formData.email?.trim() || null,
      phone: formData.phone?.trim() || null,
      websiteUrl: formData.websiteUrl?.trim() || null,
      linkedinUrl: formData.linkedinUrl?.trim() || null,
      instagramUrl: formData.instagramUrl?.trim() || null,
      addressZipCode: formData.addressZipCode?.trim() || null,
      addressStreet: formData.addressStreet?.trim() || null,
      addressNumber: formData.addressNumber?.trim() || null,
      addressComplement: formData.addressComplement?.trim() || null,
      addressNeighborhood: formData.addressNeighborhood?.trim() || null,
      addressCity: formData.addressCity?.trim() || null,
      addressState: formData.addressState?.trim() || null,
      aboutUs: formData.aboutUs?.trim() || null,
      cultureValues: formData.cultureValues?.trim() || null,
      logoUrl: formData.logoUrl?.trim() || null,
      primaryColor: formData.primaryColor?.trim() || "#D4AF37",
    }
  });

  revalidatePath("/settings/organization");
  return { success: true };
}
