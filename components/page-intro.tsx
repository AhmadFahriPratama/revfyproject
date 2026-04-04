import { DepthButton } from "@/components/depth-button";

type Action = {
  label: string;
  href: string;
  tone?: "violet" | "cyan" | "ghost";
};

type Stat = {
  label: string;
  value: string;
};

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  stats: Stat[];
  actions?: Action[];
  badges?: string[];
  note?: string;
  children?: React.ReactNode;
};

export function PageIntro({ eyebrow, title, description, stats, actions = [], badges = [], note, children }: PageIntroProps) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {badges.length > 0 ? (
          <div className="chip-row">
            {badges.map((badge) => (
              <span key={badge} className="tone-chip">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        {actions.length > 0 ? (
          <div className="hero-actions">
            {actions.map((action) => (
              <DepthButton key={`${action.href}-${action.label}`} href={action.href} tone={action.tone}>
                {action.label}
              </DepthButton>
            ))}
          </div>
        ) : null}
        {note ? <p className="hero-note">{note}</p> : null}
        <div className="stat-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>
      </div>
      <div className="hero-visual">{children}</div>
    </section>
  );
}
