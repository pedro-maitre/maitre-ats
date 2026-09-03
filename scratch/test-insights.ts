import { prisma } from "../src/lib/prisma";

async function testInsights() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        organization: true,
        applications: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const applications = await prisma.application.findMany({
      include: {
        candidate: true,
        stage: true,
        job: {
          include: {
            organization: true,
          },
        },
        interviews: true,
        offers: true,
        hireConversion: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Jobs found: ${jobs.length}`);
    console.log(`Applications found: ${applications.length}`);

    // Simulate map
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      jobId: app.job?.id || "",
      jobTitle: app.job?.title || "Vaga Desconhecida",
      department: app.job?.department || null,
      organizationId: app.job?.organizationId || "",
      organizationName: app.job?.organization?.name || "Organização Desconhecida",
      candidateName: app.candidate ? `${app.candidate.firstName} ${app.candidate.lastName}`.trim() : "Candidato Desconhecido",
      source: app.candidate?.source || "Banco de Talentos",
      fitCategory: app.fitCategory,
      matchScore: app.matchScore,
      salaryExpectation: app.salaryExpectation,
      createdAt: app.createdAt.toISOString(),
      isHired: !!app.hireConversion,
      hiredAt: app.hireConversion?.convertedAt ? app.hireConversion.convertedAt.toISOString() : null,
      salaryOffered: app.offers?.[0]?.salaryOffered || null,
      employmentType: app.offers?.[0]?.employmentType || app.job?.employmentType || "CLT",
      interviewsCount: app.interviews?.length || 0,
      offersCount: app.offers?.length || 0,
      currentStageName: app.stage?.name || "Estágio Desconhecido",
    }));
    
    console.log("Map successful");

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testInsights();
