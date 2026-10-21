import type { Metadata, Viewport } from "next";
import { Bungee, Rubik } from "next/font/google";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin"] });
const bungee = Bungee({ variable: "--font-bungee", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "alvaro2b", template: "%s · alvaro2b" },
  description: "Los juegos de mesa del grupo: catálogo, sesiones, votaciones, partidas y fotos.",
  applicationName: "alvaro2b",
  appleWebApp: { capable: true, title: "alvaro2b", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icons/180" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15121f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${rubik.variable} ${bungee.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
