"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";

export function AccessGate({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, session } = useAuth();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requireAdmin && session.role !== "admin") {
      router.replace("/dashboard?denied=admin");
    }
  }, [pathname, ready, requireAdmin, router, session]);

  if (!ready || !session || (requireAdmin && session.role !== "admin")) {
    return (
      <section className="guard-panel">
        <span className="eyebrow">Memuat Halaman</span>
        <h1>{requireAdmin ? "Memverifikasi akses admin" : "Memverifikasi sesi belajar"}</h1>
        <p>
          {requireAdmin
            ? "Halaman admin membutuhkan izin khusus. Sistem sedang mengarahkan Anda ke halaman yang sesuai."
            : "Sistem sedang memeriksa sesi aktif dan mengarahkan Anda ke login bila diperlukan."}
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
