import { AccessGate } from "@/components/access-gate";
import { DashboardPanel } from "@/components/dashboard-panel";
import { dashboardMilestones, dashboardRecommendations } from "@/lib/catalog";

export default function DashboardPage() {
  return (
    <AccessGate>
      <DashboardPanel recommendations={dashboardRecommendations} milestones={dashboardMilestones} />
    </AccessGate>
  );
}
