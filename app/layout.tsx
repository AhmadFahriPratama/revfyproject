import type { Metadata } from "next";

import "@/app/globals.css";
import "@/app/upgrade.css";
import { AppFrame } from "@/components/app-frame";
import { AuthProvider } from "@/lib/auth";
import { ExperienceProvider } from "@/lib/experience";
import { PerformanceProvider } from "@/lib/performance";

export const metadata: Metadata = {
  title: {
    default: "REVFY Orbit",
    template: "%s | REVFY Orbit",
  },
  description: "Frontend Next.js dan Three.js untuk navigasi belajar, tryout, dashboard, dan admin access yang lebih hidup namun tetap ringan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <PerformanceProvider>
          <ExperienceProvider>
            <AuthProvider>
              <AppFrame>{children}</AppFrame>
            </AuthProvider>
          </ExperienceProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
