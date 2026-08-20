import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Plus } from "lucide-react";
import JobDashboardView from "@/components/jobs/JobDashboardView";

export default async function JobsPage() {
  const session = await getServerSession(authOptions);

  const jobs = await prisma.job.findMany({
    include: {
      recruiter: {
        select: { name: true },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedJobs = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    status: job.status,
    recruiterId: job.recruiterId,
    hiringManagerId: job.hiringManagerId,
    recruiterName: job.recruiter?.name,
    applicationsCount: job._count.applications,
    createdAt: job.createdAt,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Vagas & Processos Seletivos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Gerencie todas as oportunidades ativas da Maître Consultoria.
          </p>
        </div>

        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-maitre-gold to-[#e5c07b] text-slate-950 px-5 py-2.5 rounded-xl font-extrabold shadow-md hover:brightness-105 transition-all text-sm active:scale-95"
        >
          <Plus size={18} />
          <span>Criar Nova Vaga</span>
        </Link>
      </div>

      <JobDashboardView
        initialJobs={formattedJobs}
        currentUserId={session?.user?.id}
        userRole={session?.user?.role}
      />
    </div>
  );
}
