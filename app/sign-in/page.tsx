import { Suspense } from "react";

import { LoginPanel } from "@/components/login-panel";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <section className="guard-panel">
          <span className="eyebrow">Sign In</span>
          <h1>Menyiapkan halaman pendaftaran</h1>
          <p>Halaman sign in sedang dimuat. Tunggu sebentar.</p>
        </section>
      }
    >
      <LoginPanel mode="sign-in" />
    </Suspense>
  );
}
