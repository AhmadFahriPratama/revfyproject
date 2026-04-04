import { AccessGate } from "@/components/access-gate";
import { AdminPanel } from "@/components/admin-panel";
import { formatNumber, platformSnapshot } from "@/lib/catalog";

export default function AdminPage() {
  return (
    <AccessGate requireAdmin>
      <AdminPanel
        stats={[
          { label: "JSON sets", value: formatNumber(platformSnapshot.totalTryouts) },
          { label: "Question bank", value: formatNumber(platformSnapshot.totalQuestions) },
          { label: "Categories", value: formatNumber(platformSnapshot.totalCategories) },
        ]}
      />
    </AccessGate>
  );
}
