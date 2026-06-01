import { RiskDetailPage } from "@/components/pages/RiskPage";

export default async function Page({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  return <RiskDetailPage accountId={accountId} />;
}
