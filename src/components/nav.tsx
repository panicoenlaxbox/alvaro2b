"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/sessions", label: "Sesiones", icon: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" },
  { href: "/games", label: "Juegos", icon: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm4 5h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01" },
  { href: "/photos", label: "Fotos", icon: "M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { href: "/stats", label: "Estadísticas", icon: "M4 20V10m6 10V4m6 16v-7m4 7H2" },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

function Icon({ d, className }: { d: string; className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/** The phone's tab bar. */
export function BottomNav() {
  const isActive = useActive();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t-4 border-accent bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-1.5 py-1.5">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold ${active ? "bg-accent text-ink" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon d={item.icon} className="size-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The same sections in the header, for wide screens. */
export function TopNav() {
  const isActive = useActive();

  return (
    <nav aria-label="Principal" className="hidden md:block">
      <ul className="flex gap-1">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.9375rem] font-bold lg:px-3 ${active ? "bg-accent text-ink" : "text-foreground hover:bg-card"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon d={item.icon} className="hidden size-5 lg:block" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
