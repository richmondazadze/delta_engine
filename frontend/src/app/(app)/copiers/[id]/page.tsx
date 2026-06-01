import { CopierFormPage } from "@/components/pages/CopiersPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CopierFormPage copierId={id} />;
}
