"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { DepthButton } from "@/components/depth-button";
import { PageIntro } from "@/components/page-intro";
import { useAuth, type SessionPlan, type SessionRole } from "@/lib/auth";

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

function toRoleBreakdown(items: Array<{ role: SessionRole; total: number }>): WorkspaceBreakdown[] {
  return items.map((item) => ({ label: formatRole(item.role), total: item.total }));
}

function toPlanBreakdown(items: Array<{ plan: SessionPlan; total: number }>): WorkspaceBreakdown[] {
  return items.map((item) => ({ label: formatPlan(item.plan), total: item.total }));
}

export function AdminPanel({ stats }: { stats: PageStat[] }) {
  const { session, source } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState("Memuat data admin...");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersStatus, setUsersStatus] = useState("Memuat daftar user...");
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [codesStatus, setCodesStatus] = useState("Memuat redeem code...");
  const [userQuery, setUserQuery] = useState("");
  const deferredUserQuery = useDeferredValue(userQuery);
  const [savingUsername, setSavingUsername] = useState<string | null>(null);
  const [creatingCodes, setCreatingCodes] = useState(false);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, SessionRole>>({});
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    plan: "pro" as SessionPlan,
    quantity: "3",
    usageLimit: "1",
    prefix: "PRO",
    expiresAt: "",
    note: "Promo admin batch terbaru",
  });

  const adminUnavailable = source === "local";

  const summaryCards = useMemo(
    () => [
      { label: "Pengguna", value: formatCount(workspace?.summary.users ?? emptySummary.users) },
      { label: "Sesi aktif", value: formatCount(workspace?.summary.sessions ?? emptySummary.sessions) },
      { label: "Redeem aktif", value: formatCount(workspace?.summary.activeRedeemCodes ?? emptySummary.activeRedeemCodes) },
      { label: "Subscription", value: formatCount(workspace?.summary.subscriptions ?? emptySummary.subscriptions) },
      { label: "Progres", value: formatCount(workspace?.summary.progress ?? emptySummary.progress) },
      { label: "Riwayat", value: formatCount(workspace?.summary.attempts ?? emptySummary.attempts) },
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

    void Promise.all([loadWorkspace(), loadCodes()]);

    return () => {
      cancelled = true;
    };
  }, [adminUnavailable]);

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

  if (!session) {
    return null;
  }

  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Admin"
        title="Panel admin yang fokus ke redeem code, role user, dan stats"
        description="Area admin dipusatkan ke tiga pekerjaan inti: memantau statistik, membuat redeem code, dan mengubah role user dengan cepat."
        badges={[`User ${session.username}`, `Role ${session.role.toUpperCase()}`, `Plan ${session.plan.toUpperCase()}`]}
        note="Gunakan halaman ini untuk tugas admin yang paling sering dipakai tanpa informasi tambahan yang tidak perlu."
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

      <section className="content-grid content-grid--two">
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
      </section>

      <section className="content-grid content-grid--two">
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
      </section>

      <section className="glass-panel card-surface">
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
      </section>
    </div>
  );
}
