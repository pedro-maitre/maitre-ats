import { redirect } from "next/navigation";

export default async function CareersRedirect({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  redirect(`/carreiras/${companySlug}`);
}
