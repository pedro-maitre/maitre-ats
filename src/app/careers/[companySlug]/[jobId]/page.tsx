import { redirect } from "next/navigation";

export default async function JobDetailsRedirect({
  params,
}: {
  params: Promise<{ companySlug: string; jobId: string }>;
}) {
  const { companySlug, jobId } = await params;
  redirect(`/carreiras/${companySlug}/${jobId}`);
}
