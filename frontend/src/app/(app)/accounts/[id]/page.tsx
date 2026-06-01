import AccountDetailPage from "@/components/pages/AccountDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountDetailPage id={id} />;
}
