"use server";

import { prisma } from "@/lib/prisma";

export async function getCandidateDetails(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: true,
      evaluations: {
        orderBy: { createdAt: 'desc' },
        include: { evaluator: true }
      }
    }
  });
  return app;
}

export async function saveEvaluation(applicationId: string, feedback: string, rating: number) {
  // In a real app we would get the evaluatorId from session
  // For now, we find the first user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { email: "recruiter@maitre.com", name: "Recrutador", role: "RECRUITER" }
    });
  }

  await prisma.evaluation.create({
    data: {
      applicationId,
      evaluatorId: user.id,
      feedback,
      rating
    }
  });
}
