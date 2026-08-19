"use server";

import { prisma } from "@/lib/prisma";

export async function moveCandidate(applicationId: string, newStageId: string) {
  try {
    await prisma.application.update({
      where: { id: applicationId },
      data: { 
        stageId: newStageId,
        enteredStageAt: new Date(),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to move candidate", error);
    return { success: false, error: "Failed to move candidate" };
  }
}
