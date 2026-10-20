import Link from "next/link";
import type { CurrentMember } from "@/lib/auth";
import { Avatar } from "./avatar";

export function Header({ member }: { member: CurrentMember }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))]">
      <Link href="/" className="text-lg font-bold tracking-tight">
        alvaro2b
      </Link>
      <Link href="/more" className="flex items-center gap-2 text-sm" aria-label="Más opciones">
        <span className="hidden sm:inline">{member.displayName}</span>
        <Avatar name={member.displayName} url={member.avatarUrl} />
      </Link>
    </header>
  );
}
