import { Suspense } from "react";
import { CopierFormPage } from "@/components/pages/CopiersPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="page-inner faint">Loading…</div>}>
      <CopierFormPage />
    </Suspense>
  );
}
