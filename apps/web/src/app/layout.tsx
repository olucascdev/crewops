import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrewOps",
  description: "Operational field service control for internet providers.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#163b36",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* THESIS: CrewOps opens on the live operation, refusing a generic SaaS hero. OWN-WORLD: utility-console layout with field-map colors, compact panels, strong status chips, and restrained industrial contrast. STORY: a provider owner sees technicians, service orders, and GPS policy immediately. FIRST VIEWPORT: left rail, operational command header, KPI strip, map-like activity field, and technician event feed. FORM: code-led greenfield surface for Operate mode. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
        {children}
      </body>
    </html>
  );
}
