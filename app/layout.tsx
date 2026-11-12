import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Campino · Prenota", template: "%s · Campino" },
  description: "Prenota il campino scegliendo il tuo nome e il giorno della partita.",
  applicationName: "Campino",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Campino", statusBarStyle: "default" },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#17263d", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body>{children}</body></html>;
}
