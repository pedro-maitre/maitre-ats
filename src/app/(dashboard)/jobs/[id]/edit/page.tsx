import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import JobEditForm from "@/components/jobs/JobEditForm";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [job, recruiters] = await Promise.all([
    prisma.job.findUnique({
      where: { id },
      include: {
        organization: true,
        stages: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { applications: true },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ["RECRUITER", "ADMIN", "SUPER_ADMIN"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!job) {
    redirect("/jobs");
  }

  const jobData = {
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    employmentType: job.employmentType,
    seniority: job.seniority,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    status: job.status,
    description: job.description,
    recruiterId: job.recruiterId,
    requiredSkills: job.requiredSkills,
    organizationSlug: job.organization?.slug || "maitre",
    stages: job.stages.map((st) => ({
      id: st.id,
      name: st.name,
      order: st.order,
      candidatesCount: st._count.applications,
    })),
  };

  return (
    <JobEditForm
      job={jobData}
      recruiters={recruiters}
      userRole={session?.user?.role}
    />
  );
}
