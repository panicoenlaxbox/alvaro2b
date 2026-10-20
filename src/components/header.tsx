import Link from "next/link";
import type { CurrentMember } from "@/lib/auth";
import { Avatar } from "./avatar";
import { LogoDie } from "./logo";
import { TopNav } from "./nav";

export function Header({ member }: { member: CurrentMember }) {
  return (
    <header className="sticky top-0 z-20 border-b-4 border-accent bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoDie />
          <span className="font-display text-xl tracking-wide">alvaro2b</span>
        </Link>
        <TopNav />
        <Link href="/more" className="flex min-h-11 items-center gap-2 rounded-full text-sm font-bold" aria-label="Más opciones">
          <span className="hidden lg:inline">{member.displayName}</span>
          <span className="rounded-full border-[3px] border-ink">
            <Avatar name={member.displayName} url={member.avatarUrl} size={36} />
          </span>
        </Link>
      </div>
    </header>
  );
}
