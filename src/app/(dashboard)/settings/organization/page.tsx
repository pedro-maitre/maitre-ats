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

  if (!user || !user.organization) redirect("/login");

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        Detalhes da Empresa
      </h2>
      <OrgForm initialData={{
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        role: user.role,
      }} />
    </div>
  );
}
