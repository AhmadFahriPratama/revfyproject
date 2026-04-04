"use client";

import { useRouter } from "next/navigation";

import { DepthButton } from "@/components/depth-button";
import { type SessionPlan, useAuth } from "@/lib/auth";

type Plan = {
  name: string;
  price: string;
  accent: string;
  description: string;
  features: string[];
};

const planKeys: Record<string, SessionPlan> = {
  Free: "free",
  Pro: "pro",
  Elite: "elite",
};

export function SubscriptionDeck({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const { session, setPlan } = useAuth();

  const handleSelect = async (name: string) => {
    if (!session) {
      router.push("/login?next=/subscription");
      return;
    }

    await setPlan(planKeys[name]);
    router.push("/dashboard");
  };

  return (
    <section className="content-grid content-grid--three">
      {plans.map((plan) => {
        const active = session && planKeys[plan.name] === session.plan;

        return (
          <article key={plan.name} className={active ? "glass-panel card-surface card-surface--active" : "glass-panel card-surface"}>
            <div className="plan-head">
              <span className="card-tag">{plan.accent}</span>
              <strong className="plan-price">{plan.price}</strong>
            </div>
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className="stack-sm">
              {plan.features.map((feature) => (
                <div key={feature} className="feature-row">
                  <span className="feature-dot" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <DepthButton tone={active ? "ghost" : "violet"} onClick={() => void handleSelect(plan.name)}>
              {active ? "Plan aktif" : session ? `Pilih ${plan.name}` : "Login untuk memilih"}
            </DepthButton>
          </article>
        );
      })}
    </section>
  );
}
