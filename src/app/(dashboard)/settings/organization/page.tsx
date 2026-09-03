import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrgForm from "./OrgForm";
import { redirect } from "next/navigation";

export default async function OrganizationPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true }
  });

  let organization = user?.organization;
  if (!organization) {
    organization = await prisma.organization.findFirst();
  }

  if (!user || !organization) {
    redirect("/");
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        Detalhes da Empresa
      </h2>
      <OrgForm initialData={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: user.role,
        legalName: organization.legalName || "",
        cnpj: organization.cnpj || "",
        industry: organization.industry || "",
        companySize: organization.companySize || "",
        foundedYear: organization.foundedYear ? String(organization.foundedYear) : "",
        email: organization.email || "",
        phone: organization.phone || "",
        websiteUrl: organization.websiteUrl || "",
        linkedinUrl: organization.linkedinUrl || "",
        instagramUrl: organization.instagramUrl || "",
        addressZipCode: organization.addressZipCode || "",
        addressStreet: organization.addressStreet || "",
        addressNumber: organization.addressNumber || "",
        addressComplement: organization.addressComplement || "",
        addressNeighborhood: organization.addressNeighborhood || "",
        addressCity: organization.addressCity || "",
        addressState: organization.addressState || "",
        aboutUs: organization.aboutUs || "",
        cultureValues: organization.cultureValues || "",
        logoUrl: organization.logoUrl || "",
        primaryColor: organization.primaryColor || "#D4AF37",
      }} />
    </div>
  );
}
