import { requireMember } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/header";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const member = await requireMember();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <Header member={member} />
      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
