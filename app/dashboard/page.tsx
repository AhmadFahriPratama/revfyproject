import { AccessGate } from "@/components/access-gate";
import { DashboardPanel } from "@/components/dashboard-panel";
import { dashboardMilestones, getDashboardRecommendations } from "@/lib/catalog";

export const revalidate = 300;

export default function DashboardPage() {
  return (
    <AccessGate>
      <DashboardPanel recommendations={getDashboardRecommendations()} milestones={dashboardMilestones} />
    </AccessGate>
  );
}
