import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();

    // Find candidate by email
    const candidate = await prisma.candidate.findUnique({
      where: { email },
      include: {
        applications: {
          include: {
            job: {
              include: {
                organization: {
                  select: { name: true, slug: true },
                },
                stages: {
                  orderBy: { order: "asc" },
                },
              },
            },
            stage: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({
        candidate: null,
        applications: [],
      });
    }

    let candidateTags: string[] = [];
    if (candidate.tags) {
      try {
        const parsed = JSON.parse(candidate.tags);
        candidateTags = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        candidateTags = candidate.tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    return NextResponse.json({
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        linkedinUrl: candidate.linkedinUrl,
        resumeUrl: candidate.resumeUrl,
        profileSummary: candidate.profileSummary,
        tags: candidateTags,
      },
      applications: candidate.applications.map((app) => ({
        id: app.id,
        jobId: app.job.id,
        jobTitle: app.job.title,
        jobDepartment: app.job.department,
        jobLocation: app.job.location,
        companyName: app.job.organization.name,
        companySlug: app.job.organization.slug,
        salaryExpectation: app.salaryExpectation,
        appliedAt: app.createdAt,
        currentStage: {
          id: app.stage.id,
          name: app.stage.name,
          order: app.stage.order,
        },
        allStages: app.job.stages.map((st) => ({
          id: st.id,
          name: st.name,
          order: st.order,
          isCompleted: st.order < app.stage.order,
          isCurrent: st.id === app.stage.id,
        })),
      })),
    });
  } catch (error: any) {
    console.error("Candidate applications API error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidaturas." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const body = await req.json();
    const { firstName, lastName, phone, linkedinUrl, profileSummary, resumeUrl, tags } = body;

    let formattedTags: string | undefined = undefined;
    if (tags !== undefined) {
      formattedTags = Array.isArray(tags) ? JSON.stringify(tags) : String(tags);
    }

    const updated = await prisma.candidate.update({
      where: { email },
      data: {
        firstName: firstName || undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        phone: phone !== undefined ? phone : undefined,
        linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
        profileSummary: profileSummary !== undefined ? profileSummary : undefined,
        resumeUrl: resumeUrl || undefined,
        tags: formattedTags,
      },
    });

    return NextResponse.json({
      success: true,
      candidate: updated,
    });
  } catch (error: any) {
    console.error("Update candidate error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil." },
      { status: 500 }
    );
  }
}
