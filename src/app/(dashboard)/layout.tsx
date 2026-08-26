import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TenantProvider } from "@/lib/tenant-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Candidates MUST NOT access the internal recruiter ATS dashboard!
  if (session.user.role === "CANDIDATE") {
    redirect("/carreiras/maitre/candidato");
  }

  // Buscar organizações disponíveis para o contexto multitenant
  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          jobs: true,
          candidates: true,
          users: true,
        },
      },
    },
  });

  return (
    <TenantProvider initialOrganizations={organizations}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-maitre-gold selection:text-slate-900">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <Topbar />
          {children}
        </main>
      </div>
    </TenantProvider>
  );
}

