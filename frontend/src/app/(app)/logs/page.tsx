import { Suspense } from "react";
import LogsPage from "@/components/pages/LogsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="page-inner faint">Loading copy log…</div>}>
      <LogsPage />
    </Suspense>
  );
}
