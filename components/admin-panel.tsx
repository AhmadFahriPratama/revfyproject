"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { DepthButton } from "@/components/depth-button";
import { PageIntro } from "@/components/page-intro";
import { useAuth, type SessionPlan, type SessionRole } from "@/lib/auth";
import { dailyTryoutTokenChannelUrl } from "@/lib/marketing";

type PageStat = {
  label: string;
  value: string;
};

type WorkspaceSummary = {
  users: number;
  admins: number;
  students: number;
  sessions: number;
  progress: number;
  attempts: number;
  subscriptions: number;
  redeemCodes: number;
  activeRedeemCodes: number;
  tryoutTokens: number;
  activeTryoutTokens: number;
  databaseConnected: number;
};

type WorkspaceBreakdown = {
  label: string;
  total: number;
};

type AdminUser = {
  id: number;
  username: string;
  displayName: string;
  role: SessionRole;
  plan: SessionPlan;
  focus: string;
  activeSessions: number;
  createdAt: string;
  updatedAt: string;
};

type RedeemCode = {
  id: number;
  code: string;
  plan: SessionPlan;
  status: "active" | "redeemed" | "disabled" | "expired";
  usageLimit: number;
  usageCount: number;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdByUsername: string | null;
  redeemedByUsername: string | null;
};

type WorkspacePayload = {
  summary: WorkspaceSummary;
  roleBreakdown: Array<{ role: SessionRole; total: number }>;
  planBreakdown: Array<{ plan: SessionPlan; total: number }>;
  recentUsers: AdminUser[];
  recentRedeemCodes: RedeemCode[];
};

type TryoutToken = {
  id: number;
  code: string;
  tokenScope: "gratis" | "berbayar" | "all";
  status: "active" | "disabled" | "expired" | "depleted";
  usageLimit: number;
  usageCount: number;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdByUsername: string | null;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const emptySummary: WorkspaceSummary = {
  users: 0,
  admins: 0,
  students: 0,
  sessions: 0,
  progress: 0,
  attempts: 0,
  subscriptions: 0,
  redeemCodes: 0,
  activeRedeemCodes: 0,
  tryoutTokens: 0,
  activeTryoutTokens: 0,
  databaseConnected: 0,
};

const roleOptions: SessionRole[] = ["student", "admin"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatRole(role: SessionRole) {
  return role === "admin" ? "Admin" : "Student";
}

function formatPlan(plan: SessionPlan) {
  return plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Elite";
}

function formatCodeStatus(status: RedeemCode["status"]) {
  switch (status) {
    case "active":
      return "Aktif";
    case "redeemed":
      return "Terpakai";
    case "expired":
      return "Expired";
    default:
      return "Nonaktif";
  }
}

function formatTokenScope(scope: TryoutToken["tokenScope"]) {
  return scope === "all" ? "Semua tryout" : scope === "gratis" ? "Gratis" : "Berbayar";
}

function formatTokenStatus(status: TryoutToken["status"]) {
  switch (status) {
    case "active":
      return "Aktif";
    case "expired":
      return "Expired";
    case "depleted":
      return "Kuota habis";
    default:
      return "Nonaktif";
  }
}

function toRoleBreakdown(items: Array<{ role: SessionRole; total: number }>): WorkspaceBreakdown[] {
  return items.map((item) => ({ label: formatRole(item.role), total: item.total }));
}

function toPlanBreakdown(items: Array<{ plan: SessionPlan; total: number }>): WorkspaceBreakdown[] {
  return items.map((item) => ({ label: formatPlan(item.plan), total: item.total }));
}

export function AdminPanel({ stats }: { stats: PageStat[] }) {
  const { session, source } = useAuth();
  const [activeView, setActiveView] = useState<"overview" | "tokens" | "users" | "redeem">("overview");
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState("Memuat data admin...");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersStatus, setUsersStatus] = useState("Memuat daftar user...");
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [codesStatus, setCodesStatus] = useState("Memuat redeem code...");
  const [tokens, setTokens] = useState<TryoutToken[]>([]);
  const [tokensStatus, setTokensStatus] = useState("Memuat token tryout...");
  const [tokenFilter, setTokenFilter] = useState<"all" | "active" | "disabled" | "expired" | "depleted">("all");
  const [userQuery, setUserQuery] = useState("");
  const deferredUserQuery = useDeferredValue(userQuery);
  const [savingUsername, setSavingUsername] = useState<string | null>(null);
  const [creatingCodes, setCreatingCodes] = useState(false);
  const [creatingTokens, setCreatingTokens] = useState(false);
  const [updatingTokenId, setUpdatingTokenId] = useState<number | null>(null);
  const [copyingTokenId, setCopyingTokenId] = useState<number | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, SessionRole>>({});
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    plan: "pro" as SessionPlan,
    quantity: "3",
    usageLimit: "1",
    prefix: "PRO",
    expiresAt: "",
    note: "Promo admin batch terbaru",
  });
  const [tokenForm, setTokenForm] = useState({
    tokenScope: "berbayar" as "gratis" | "berbayar" | "all",
    quantity: "1",
    usageLimit: "50",
    prefix: "DAILY",
    expiresAt: "",
    note: "Token gratis harian dari channel",
  });

  const adminUnavailable = source === "local";

  const summaryCards = useMemo(
    () => [
      { label: "Pengguna", value: formatCount(workspace?.summary.users ?? emptySummary.users) },
      { label: "Database", value: workspace?.summary.databaseConnected ? "Online" : "Offline" },
      { label: "Sesi aktif", value: formatCount(workspace?.summary.sessions ?? emptySummary.sessions) },
      { label: "Token aktif", value: formatCount(workspace?.summary.activeTryoutTokens ?? emptySummary.activeTryoutTokens) },
      { label: "Redeem aktif", value: formatCount(workspace?.summary.activeRedeemCodes ?? emptySummary.activeRedeemCodes) },
      { label: "Subscription", value: formatCount(workspace?.summary.subscriptions ?? emptySummary.subscriptions) },
    ],
    [workspace],
  );

  useEffect(() => {
    if (adminUnavailable) {
      setWorkspace(null);
      setWorkspaceStatus("Sebagian data belum tersedia pada sesi ini.");
      setUsers([]);
      setUsersStatus("Daftar user belum tersedia.");
      setCodes([]);
      setCodesStatus("Redeem code belum tersedia.");
      setTokens([]);
      setTokensStatus("Token tryout belum tersedia.");
      return;
    }

    let cancelled = false;

    const loadWorkspace = async () => {
      try {
        const response = await fetch("/api/admin/workspace", { cache: "no-store" });
        const payload = (await response.json()) as WorkspacePayload & { ok?: boolean; error?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setWorkspace(null);
          setWorkspaceStatus(payload.error ?? "Data admin tidak bisa dimuat.");
          return;
        }

        setWorkspace(payload);
        setWorkspaceStatus("Data admin berhasil dimuat.");
      } catch {
        if (!cancelled) {
          setWorkspace(null);
          setWorkspaceStatus("Data admin belum bisa dimuat sekarang.");
        }
      }
    };

    const loadCodes = async () => {
      try {
        const response = await fetch("/api/admin/redeem-codes?limit=12", { cache: "no-store" });
        const payload = (await response.json()) as { ok?: boolean; codes?: RedeemCode[]; error?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setCodes([]);
          setCodesStatus(payload.error ?? "Redeem code tidak bisa dimuat.");
          return;
        }

        setCodes(payload.codes ?? []);
        setCodesStatus("Redeem code berhasil dimuat.");
      } catch {
        if (!cancelled) {
          setCodes([]);
          setCodesStatus("Redeem code belum bisa dimuat sekarang.");
        }
      }
    };

    const loadTokens = async () => {
      try {
        const response = await fetch(`/api/admin/tryout-tokens?limit=12&status=${encodeURIComponent(tokenFilter)}`, { cache: "no-store" });
        const payload = (await response.json()) as { ok?: boolean; tokens?: TryoutToken[]; error?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setTokens([]);
          setTokensStatus(payload.error ?? "Token tryout tidak bisa dimuat.");
          return;
        }

        setTokens(payload.tokens ?? []);
        setTokensStatus("Token tryout berhasil dimuat.");
      } catch {
        if (!cancelled) {
          setTokens([]);
          setTokensStatus("Token tryout belum bisa dimuat sekarang.");
        }
      }
    };

    void Promise.all([loadWorkspace(), loadCodes(), loadTokens()]);

    return () => {
      cancelled = true;
    };
  }, [adminUnavailable, tokenFilter]);

  useEffect(() => {
    if (adminUnavailable) {
      return;
    }

    let cancelled = false;

    const loadUsers = async () => {
      try {
        const query = deferredUserQuery.trim();
        const response = await fetch(`/api/admin/users?limit=24&q=${encodeURIComponent(query)}`, { cache: "no-store" });
        const payload = (await response.json()) as { ok?: boolean; users?: AdminUser[]; error?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setUsers([]);
          setUsersStatus(payload.error ?? "Daftar user tidak bisa dimuat.");
          return;
        }

        const nextUsers = payload.users ?? [];
        setUsers(nextUsers);
        setRoleDrafts((current) => {
          const nextDrafts = { ...current };

          for (const user of nextUsers) {
            nextDrafts[user.username] = current[user.username] ?? user.role;
          }

          return nextDrafts;
        });
        setUsersStatus(query ? `Menampilkan hasil untuk \"${query}\".` : "Menampilkan user terbaru.");
      } catch {
        if (!cancelled) {
          setUsers([]);
          setUsersStatus("Gagal menghubungi daftar user.");
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [adminUnavailable, deferredUserQuery]);

  const largestRoleTotal = Math.max(...toRoleBreakdown(workspace?.roleBreakdown ?? []).map((item) => item.total), 1);
  const largestPlanTotal = Math.max(...toPlanBreakdown(workspace?.planBreakdown ?? []).map((item) => item.total), 1);

  const refreshWorkspace = async () => {
    const response = await fetch("/api/admin/workspace", { cache: "no-store" });
    const payload = (await response.json()) as WorkspacePayload & { ok?: boolean; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Data admin tidak bisa diperbarui.");
    }

    setWorkspace(payload);
    setWorkspaceStatus("Data admin berhasil dimuat.");
  };

  const refreshCodes = async () => {
    const response = await fetch("/api/admin/redeem-codes?limit=12", { cache: "no-store" });
    const payload = (await response.json()) as { ok?: boolean; codes?: RedeemCode[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Redeem code tidak bisa diperbarui.");
    }

    setCodes(payload.codes ?? []);
    setCodesStatus("Redeem code berhasil dimuat.");
  };

  const refreshTokens = async () => {
    const response = await fetch(`/api/admin/tryout-tokens?limit=12&status=${encodeURIComponent(tokenFilter)}`, { cache: "no-store" });
    const payload = (await response.json()) as { ok?: boolean; tokens?: TryoutToken[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Token tryout tidak bisa diperbarui.");
    }

    setTokens(payload.tokens ?? []);
    setTokensStatus("Token tryout berhasil dimuat.");
  };

  const handleRoleSave = async (user: AdminUser) => {
    const nextRole = roleDrafts[user.username] ?? user.role;

    if (nextRole === user.role) {
      return;
    }

    setSavingUsername(user.username);
    setUsersStatus(`Menyimpan role untuk ${user.username}...`);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: user.username, role: nextRole }),
      });
      const payload = (await response.json()) as { ok?: boolean; user?: AdminUser; error?: string };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error ?? "Role user tidak bisa diubah.");
      }

      setUsers((current) => current.map((item) => (item.username === user.username ? payload.user! : item)));
      setWorkspace((current) =>
        current
          ? {
              ...current,
              recentUsers: current.recentUsers.map((item) => (item.username === user.username ? payload.user! : item)),
            }
          : current,
      );
      await refreshWorkspace();
      setUsersStatus(`Role ${user.username} berhasil diubah ke ${formatRole(nextRole)}.`);
    } catch (error) {
      setUsersStatus(error instanceof Error ? error.message : "Role user tidak bisa diubah.");
    } finally {
      setSavingUsername(null);
    }
  };

  const handleCreateCodes = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingCodes(true);
    setCreateStatus("Membuat redeem code baru...");

    try {
      const response = await fetch("/api/admin/redeem-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: createForm.plan,
          quantity: Number(createForm.quantity),
          usageLimit: Number(createForm.usageLimit),
          prefix: createForm.prefix,
          note: createForm.note,
          expiresAt: createForm.expiresAt || undefined,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; codes?: RedeemCode[]; error?: string };

      if (!response.ok || !payload.codes) {
        throw new Error(payload.error ?? "Redeem code gagal dibuat.");
      }

      setCodes((current) => [...payload.codes!, ...current].slice(0, 12));
      await refreshWorkspace();
      await refreshCodes();
      setCreateStatus(`${payload.codes.length} redeem code baru berhasil dibuat.`);
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : "Redeem code gagal dibuat.");
    } finally {
      setCreatingCodes(false);
    }
  };

  const handleCreateTokens = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingTokens(true);
    setTokenStatus("Membuat token tryout baru...");

    try {
      const response = await fetch("/api/admin/tryout-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenScope: tokenForm.tokenScope,
          quantity: Number(tokenForm.quantity),
          usageLimit: Number(tokenForm.usageLimit),
          prefix: tokenForm.prefix,
          note: tokenForm.note,
          expiresAt: tokenForm.expiresAt || undefined,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; tokens?: TryoutToken[]; error?: string };

      if (!response.ok || !payload.tokens) {
        throw new Error(payload.error ?? "Token tryout gagal dibuat.");
      }

      setTokens((current) => [...payload.tokens!, ...current].slice(0, 12));
      await refreshWorkspace();
      await refreshTokens();
      setTokenStatus(`${payload.tokens.length} token tryout baru berhasil dibuat.`);
    } catch (error) {
      setTokenStatus(error instanceof Error ? error.message : "Token tryout gagal dibuat.");
    } finally {
      setCreatingTokens(false);
    }
  };

  const handleGenerateDailyToken = async () => {
    setCreatingTokens(true);
    setTokenStatus("Membuat atau mengambil token harian WhatsApp...");

    try {
      const response = await fetch("/api/admin/tryout-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate_daily_whatsapp",
          usageLimit: Number(tokenForm.usageLimit),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; token?: TryoutToken; error?: string };

      if (!response.ok || !payload.token) {
        throw new Error(payload.error ?? "Token harian WhatsApp gagal dibuat.");
      }

      await refreshWorkspace();
      await refreshTokens();
      setTokenStatus(`Token harian siap: ${payload.token.code}`);
    } catch (error) {
      setTokenStatus(error instanceof Error ? error.message : "Token harian WhatsApp gagal dibuat.");
    } finally {
      setCreatingTokens(false);
    }
  };

  const handleCopyToken = async (token: TryoutToken) => {
    setCopyingTokenId(token.id);

    try {
      await navigator.clipboard.writeText(token.code);
      setTokenStatus(`Token ${token.code} berhasil disalin.`);
    } catch {
      setTokenStatus(`Gagal menyalin token ${token.code}.`);
    } finally {
      setCopyingTokenId(null);
    }
  };

  const handleToggleTokenStatus = async (token: TryoutToken, nextStatus: "active" | "disabled") => {
    setUpdatingTokenId(token.id);
    setTokenStatus(`${nextStatus === "disabled" ? "Menonaktifkan" : "Mengaktifkan"} token ${token.code}...`);

    try {
      const response = await fetch("/api/admin/tryout-tokens", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenId: token.id, status: nextStatus }),
      });
      const payload = (await response.json()) as { ok?: boolean; token?: TryoutToken; error?: string };

      if (!response.ok || !payload.token) {
        throw new Error(payload.error ?? "Status token tidak bisa diubah.");
      }

      await refreshWorkspace();
      await refreshTokens();
      setTokenStatus(`Token ${payload.token.code} sekarang ${formatTokenStatus(payload.token.status).toLowerCase()}.`);
    } catch (error) {
      setTokenStatus(error instanceof Error ? error.message : "Status token tidak bisa diubah.");
    } finally {
      setUpdatingTokenId(null);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Admin"
        title="Admin workspace yang lebih ringkas untuk token, user, dan database"
        description="Panel admin disederhanakan menjadi beberapa view inti supaya pembuatan token, pengelolaan user, dan pemantauan database lebih cepat dipakai sehari-hari."
        badges={[`User ${session.username}`, `Role ${session.role.toUpperCase()}`, `Plan ${session.plan.toUpperCase()}`]}
        note="Pilih view yang ingin dibuka, lalu fokus ke satu jenis pekerjaan admin tanpa layar yang terlalu penuh."
        stats={stats}
      >
        <div className="glass-panel card-surface admin-hero-card">
          <span className="eyebrow">Operational Focus</span>
          <div className="stack-sm">
            <div className="list-row">
              <div>
                <strong>Create redeem code</strong>
                <p>Buat batch baru dengan plan, prefix, limit pemakaian, dan expiry.</p>
              </div>
              <span>01</span>
            </div>
            <div className="list-row">
              <div>
                <strong>Edit role user</strong>
                <p>Promosikan student ke admin atau kembalikan role dari panel yang sama.</p>
              </div>
              <span>02</span>
            </div>
            <div className="list-row">
              <div>
                <strong>Realtime stats</strong>
                <p>Lihat users, session aktif, progress, attempts, dan subscription dalam satu layar.</p>
              </div>
              <span>03</span>
            </div>
          </div>
        </div>
      </PageIntro>

      <section className="glass-panel card-surface admin-view-switcher">
        <div className="browser-toolbar__filters">
          {[
            { key: "overview", label: "Overview" },
            { key: "tokens", label: "Token Tryout" },
            { key: "users", label: "User" },
            { key: "redeem", label: "Redeem Code" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={activeView === item.key ? "filter-pill filter-pill--active" : "filter-pill"}
              onClick={() => setActiveView(item.key as "overview" | "tokens" | "users" | "redeem")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="sub-copy">
          {activeView === "overview"
            ? "Ringkasan database, distribusi akun, dan activity terbaru."
            : activeView === "tokens"
              ? "Buat dan pantau token mulai tryout yang akan dibagikan ke user."
              : activeView === "users"
                ? "Cari user lalu ubah role dari satu panel yang lebih fokus."
                : "Kelola redeem code plan tanpa bercampur dengan token tryout."}
        </p>
      </section>

      {activeView === "overview" ? <section className="content-grid content-grid--two">
        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Platform Stats</span>
            <h2>Ringkasan kesehatan platform</h2>
          </div>
          <p>{workspaceStatus}</p>
          <div className="analytics-grid admin-analytics-grid">
            {summaryCards.map((item) => (
              <article key={item.label} className="glass-panel stat-surface">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
          <div className="content-grid content-grid--two admin-breakdown-grid">
            <div className="glass-inset">
              <strong>Distribusi role</strong>
              <div className="analytics-bars">
                {toRoleBreakdown(workspace?.roleBreakdown ?? []).map((item) => (
                  <div key={item.label} className="analytics-bars__row analytics-bars__row--stacked">
                    <div className="analytics-bars__label">
                      <strong>{item.label}</strong>
                      <span>{formatCount(item.total)} akun</span>
                    </div>
                    <div className="analytics-bars__track analytics-bars__track--compact">
                      <div className="analytics-bars__fill" style={{ width: `${(item.total / largestRoleTotal) * 100}%` }} />
                    </div>
                    <strong>{formatCount(item.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-inset">
              <strong>Distribusi plan</strong>
              <div className="analytics-bars">
                {toPlanBreakdown(workspace?.planBreakdown ?? []).map((item) => (
                  <div key={item.label} className="analytics-bars__row analytics-bars__row--stacked">
                    <div className="analytics-bars__label">
                      <strong>{item.label}</strong>
                      <span>{formatCount(item.total)} akun</span>
                    </div>
                    <div className="analytics-bars__track analytics-bars__track--compact">
                      <div className="analytics-bars__fill analytics-bars__fill--mint" style={{ width: `${(item.total / largestPlanTotal) * 100}%` }} />
                    </div>
                    <strong>{formatCount(item.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Tryout Token</span>
            <h2>Status token mulai tryout</h2>
          </div>
          <p>{tokensStatus}</p>
          <div className="analytics-grid admin-analytics-grid">
            <article className="glass-panel stat-surface">
              <span>Total token</span>
              <strong>{formatCount(workspace?.summary.tryoutTokens ?? emptySummary.tryoutTokens)}</strong>
            </article>
            <article className="glass-panel stat-surface">
              <span>Token aktif</span>
              <strong>{formatCount(workspace?.summary.activeTryoutTokens ?? emptySummary.activeTryoutTokens)}</strong>
            </article>
            <article className="glass-panel stat-surface">
              <span>Total grant</span>
              <strong>{tokens.reduce((total, token) => total + token.usageCount, 0)}</strong>
            </article>
          </div>
          <div className="stack-sm">
            {tokens.slice(0, 4).map((token) => (
              <div key={token.id} className="list-row admin-code-row">
                <div>
                  <strong>{token.code}</strong>
                  <p>
                    {formatTokenScope(token.tokenScope)} · {formatTokenStatus(token.status)} · {token.usageCount}/{token.usageLimit} dipakai
                  </p>
                </div>
                <span>{token.createdByUsername ?? "system"}</span>
              </div>
            ))}
          </div>
        </article>
      </section> : null}

      {activeView === "tokens" ? <section className="content-grid content-grid--two">
        <article className="glass-panel card-surface admin-form-panel">
          <div className="section-heading">
            <span className="eyebrow">Tryout Token Builder</span>
            <h2>Buat token untuk memulai tryout</h2>
          </div>
          <p>Token ini cocok untuk campaign referral, token gratis harian, atau akses tryout premium tanpa upgrade plan penuh.</p>
          <div className="glass-inset start-panel__channel">
            <strong>Channel WhatsApp harian</strong>
            <a href={dailyTryoutTokenChannelUrl} target="_blank" rel="noreferrer" className="inline-link">
              {dailyTryoutTokenChannelUrl}
            </a>
          </div>
          <form className="stack-md" onSubmit={handleCreateTokens}>
            <div className="content-grid content-grid--two">
              <label className="field-block">
                <span>Scope</span>
                <select value={tokenForm.tokenScope} onChange={(event) => setTokenForm((current) => ({ ...current, tokenScope: event.target.value as "gratis" | "berbayar" | "all" }))} disabled={adminUnavailable || creatingTokens}>
                  <option value="berbayar">Berbayar</option>
                  <option value="gratis">Gratis</option>
                  <option value="all">Semua tryout</option>
                </select>
              </label>
              <label className="field-block">
                <span>Jumlah token</span>
                <input type="number" min={1} max={20} value={tokenForm.quantity} onChange={(event) => setTokenForm((current) => ({ ...current, quantity: event.target.value }))} disabled={adminUnavailable || creatingTokens} />
              </label>
              <label className="field-block">
                <span>Kuota pakai</span>
                <input type="number" min={1} max={5000} value={tokenForm.usageLimit} onChange={(event) => setTokenForm((current) => ({ ...current, usageLimit: event.target.value }))} disabled={adminUnavailable || creatingTokens} />
              </label>
              <label className="field-block">
                <span>Prefix</span>
                <input value={tokenForm.prefix} onChange={(event) => setTokenForm((current) => ({ ...current, prefix: event.target.value.toUpperCase() }))} placeholder="DAILY" disabled={adminUnavailable || creatingTokens} />
              </label>
            </div>
            <label className="field-block">
              <span>Expired at</span>
              <input type="datetime-local" value={tokenForm.expiresAt} onChange={(event) => setTokenForm((current) => ({ ...current, expiresAt: event.target.value }))} disabled={adminUnavailable || creatingTokens} />
            </label>
            <label className="field-block">
              <span>Catatan</span>
              <input value={tokenForm.note} onChange={(event) => setTokenForm((current) => ({ ...current, note: event.target.value }))} placeholder="Token gratis harian dari channel" disabled={adminUnavailable || creatingTokens} />
            </label>
            <div className="admin-inline-actions">
              <DepthButton type="submit" tone="cyan" className="admin-submit-button">
                {creatingTokens ? "Membuat token..." : "Buat token tryout"}
              </DepthButton>
              <DepthButton tone="ghost" onClick={() => void handleGenerateDailyToken()}>
                Buat token harian WA
              </DepthButton>
              <span className="sub-copy">{tokenStatus ?? tokensStatus}</span>
            </div>
          </form>
        </article>

        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Token List</span>
            <h2>Token tryout terbaru</h2>
          </div>
          <div className="browser-toolbar__filters">
            {[
              { key: "all", label: "Semua" },
              { key: "active", label: "Aktif" },
              { key: "disabled", label: "Nonaktif" },
              { key: "expired", label: "Expired" },
              { key: "depleted", label: "Habis" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={tokenFilter === item.key ? "filter-pill filter-pill--active" : "filter-pill"}
                onClick={() => setTokenFilter(item.key as typeof tokenFilter)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="sub-copy">Menampilkan token dengan filter {tokenFilter === "all" ? "semua status" : tokenFilter}.</p>
          <div className="stack-sm">
            {tokens.length > 0 ? (
              tokens.map((token) => (
                <div key={token.id} className="list-row admin-code-row">
                  <div>
                    <strong>{token.code}</strong>
                    <p>
                      {formatTokenScope(token.tokenScope)} · {formatTokenStatus(token.status)} · {token.usageCount}/{token.usageLimit} dipakai
                    </p>
                    <p className="sub-copy">
                      Dibuat {formatDate(token.createdAt)}
                      {token.expiresAt ? ` · Expired ${formatDate(token.expiresAt)}` : " · Tanpa expiry"}
                    </p>
                    {token.note ? <p className="sub-copy">{token.note}</p> : null}
                  </div>
                  <div className="admin-token-actions">
                    <span>{token.createdByUsername ?? "system"}</span>
                    <button type="button" className="bookmark-drawer__remove" onClick={() => void handleCopyToken(token)}>
                      {copyingTokenId === token.id ? "Menyalin..." : "Copy"}
                    </button>
                    {token.status === "active" || token.status === "disabled" ? (
                      <button
                        type="button"
                        className="bookmark-drawer__remove"
                        onClick={() => void handleToggleTokenStatus(token, token.status === "active" ? "disabled" : "active")}
                      >
                        {updatingTokenId === token.id ? "Menyimpan..." : token.status === "active" ? "Disable" : "Aktifkan"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="list-row">
                <div>
                  <strong>Belum ada token tryout</strong>
                  <p>Buat token pertama untuk campaign referral atau token gratis harian.</p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section> : null}

      {activeView === "redeem" ? <section className="content-grid content-grid--two">
        <article className="glass-panel card-surface admin-form-panel">
          <div className="section-heading">
            <span className="eyebrow">Redeem Builder</span>
            <h2>Buat redeem code baru dari panel admin</h2>
          </div>
          <p>
            {adminUnavailable
              ? "Fitur pembuatan redeem code belum tersedia pada sesi ini."
              : "Gunakan batch creation untuk promo, upgrade plan, atau akses terbatas dengan expiry yang jelas."}
          </p>
          <form className="stack-md" onSubmit={handleCreateCodes}>
            <div className="content-grid content-grid--two">
              <label className="field-block">
                <span>Plan</span>
                <select
                  value={createForm.plan}
                  onChange={(event) => setCreateForm((current) => ({ ...current, plan: event.target.value as SessionPlan }))}
                  disabled={adminUnavailable || creatingCodes}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                </select>
              </label>
              <label className="field-block">
                <span>Jumlah code</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={createForm.quantity}
                  onChange={(event) => setCreateForm((current) => ({ ...current, quantity: event.target.value }))}
                  disabled={adminUnavailable || creatingCodes}
                />
              </label>
              <label className="field-block">
                <span>Usage limit</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={createForm.usageLimit}
                  onChange={(event) => setCreateForm((current) => ({ ...current, usageLimit: event.target.value }))}
                  disabled={adminUnavailable || creatingCodes}
                />
              </label>
              <label className="field-block">
                <span>Prefix code</span>
                <input
                  value={createForm.prefix}
                  onChange={(event) => setCreateForm((current) => ({ ...current, prefix: event.target.value.toUpperCase() }))}
                  placeholder="PRO"
                  disabled={adminUnavailable || creatingCodes}
                />
              </label>
            </div>
            <label className="field-block">
              <span>Expired at</span>
              <input
                type="datetime-local"
                value={createForm.expiresAt}
                onChange={(event) => setCreateForm((current) => ({ ...current, expiresAt: event.target.value }))}
                disabled={adminUnavailable || creatingCodes}
              />
            </label>
            <label className="field-block">
              <span>Catatan</span>
              <input
                value={createForm.note}
                onChange={(event) => setCreateForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Batch promo Mei"
                disabled={adminUnavailable || creatingCodes}
              />
            </label>
            <div className="admin-inline-actions">
              <DepthButton type="submit" tone="cyan" className="admin-submit-button">
                {creatingCodes ? "Membuat redeem code..." : "Buat redeem code"}
              </DepthButton>
              <span className="sub-copy">{createStatus ?? codesStatus}</span>
            </div>
          </form>
        </article>
        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Recent Codes</span>
            <h2>Redeem code terbaru yang sudah diterbitkan</h2>
          </div>
          <p>{codesStatus}</p>
          <div className="stack-sm">
            {codes.length > 0 ? (
              codes.map((code) => (
                <div key={code.id} className="list-row admin-code-row">
                  <div>
                    <strong>{code.code}</strong>
                    <p>
                      {formatPlan(code.plan)} · {formatCodeStatus(code.status)} · {code.usageCount}/{code.usageLimit} terpakai
                    </p>
                    <p className="sub-copy">
                      Dibuat {formatDate(code.createdAt)}
                      {code.expiresAt ? ` · Expired ${formatDate(code.expiresAt)}` : " · Tanpa expiry"}
                    </p>
                    {code.note ? <p className="sub-copy">{code.note}</p> : null}
                  </div>
                  <span>{code.createdByUsername ?? "system"}</span>
                </div>
              ))
            ) : (
              <div className="list-row">
                <div>
                  <strong>Belum ada redeem code</strong>
                  <p>Buat batch pertama dari form di samping untuk mulai membagikan akses plan.</p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section> : null}

      {activeView === "overview" ? <section className="content-grid content-grid--two">
        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Recent Codes</span>
            <h2>Redeem code terbaru yang sudah diterbitkan</h2>
          </div>
          <p>{codesStatus}</p>
          <div className="stack-sm">
            {codes.length > 0 ? (
              codes.map((code) => (
                <div key={code.id} className="list-row admin-code-row">
                  <div>
                    <strong>{code.code}</strong>
                    <p>
                      {formatPlan(code.plan)} · {formatCodeStatus(code.status)} · {code.usageCount}/{code.usageLimit} terpakai
                    </p>
                    <p className="sub-copy">
                      Dibuat {formatDate(code.createdAt)}
                      {code.expiresAt ? ` · Expired ${formatDate(code.expiresAt)}` : " · Tanpa expiry"}
                    </p>
                    {code.note ? <p className="sub-copy">{code.note}</p> : null}
                  </div>
                  <span>{code.createdByUsername ?? "system"}</span>
                </div>
              ))
            ) : (
              <div className="list-row">
                <div>
                  <strong>Belum ada redeem code</strong>
                  <p>Buat batch pertama dari form di samping untuk mulai membagikan akses plan.</p>
                </div>
              </div>
            )}
          </div>
        </article>

        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Recent Activity</span>
            <h2>User terbaru yang perlu diawasi</h2>
          </div>
          <div className="stack-sm">
            {(workspace?.recentUsers ?? []).length > 0 ? (
              workspace?.recentUsers.map((user) => (
                <div key={user.id} className="list-row">
                  <div>
                    <strong>{user.displayName}</strong>
                    <p>
                      @{user.username} · {formatRole(user.role)} · {formatPlan(user.plan)}
                    </p>
                    <p className="sub-copy">Fokus {user.focus || "Umum"}</p>
                  </div>
                  <span>{user.activeSessions} sesi</span>
                </div>
              ))
            ) : (
              <div className="list-row">
                <div>
                  <strong>Belum ada activity terbaru</strong>
                  <p>Data user terbaru akan tampil di sini saat tersedia.</p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section> : null}

      {activeView === "users" ? <section className="glass-panel card-surface">
        <div className="section-heading">
          <span className="eyebrow">User Roles</span>
          <h2>Edit role user langsung dari panel admin</h2>
        </div>
        <div className="explorer-toolbar admin-user-toolbar">
          <input
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="Cari username, nama, atau fokus..."
            disabled={adminUnavailable}
          />
          <div className="glass-inset admin-toolbar-note">
            <strong>{users.length} user tampil</strong>
            <span>{usersStatus}</span>
          </div>
        </div>
        <div className="stack-sm admin-user-list">
          {users.length > 0 ? (
            users.map((user) => {
              const draftRole = roleDrafts[user.username] ?? user.role;
              const dirty = draftRole !== user.role;

              return (
                <div key={user.id} className="list-row admin-user-row">
                  <div className="admin-user-row__copy">
                    <strong>{user.displayName}</strong>
                    <p>
                      @{user.username} · {formatPlan(user.plan)} · {user.activeSessions} sesi aktif
                    </p>
                    <p className="sub-copy">Fokus {user.focus || "Umum"} · Update {formatDate(user.updatedAt)}</p>
                  </div>
                  <div className="admin-user-row__actions">
                    <select
                      value={draftRole}
                      onChange={(event) =>
                        setRoleDrafts((current) => ({
                          ...current,
                          [user.username]: event.target.value as SessionRole,
                        }))
                      }
                      disabled={adminUnavailable || savingUsername === user.username || user.username === session.username}
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatRole(option)}
                        </option>
                      ))}
                    </select>
                    <DepthButton
                      tone={dirty ? "cyan" : "ghost"}
                      size="sm"
                      onClick={() => void handleRoleSave(user)}
                      className="admin-save-button"
                    >
                      {savingUsername === user.username ? "Menyimpan..." : dirty ? "Simpan role" : "Role tersimpan"}
                    </DepthButton>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="list-row">
              <div>
                <strong>User tidak ditemukan</strong>
                <p>Coba kata kunci lain atau muat ulang halaman ini.</p>
              </div>
            </div>
          )}
        </div>
      </section> : null}
    </div>
  );
}
