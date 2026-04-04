import { Suspense } from "react";

import { LoginPanel } from "@/components/login-panel";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="guard-panel">
          <span className="eyebrow">Login</span>
          <h1>Menyiapkan panel login</h1>
          <p>Halaman login sedang dimuat. Tunggu sebentar.</p>
        </section>
      }
    >
      <LoginPanel />
    </Suspense>
  );
}
