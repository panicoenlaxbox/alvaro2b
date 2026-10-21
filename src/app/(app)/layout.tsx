import { requireMember } from "@/lib/auth";
import { BottomNav } from "@/components/nav";
import { Header } from "@/components/header";
import { NavigationTracker } from "@/components/leave";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const member = await requireMember();

  return (
    <div className="flex min-h-screen flex-col">
      <Header member={member} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32 md:pb-16">{children}</main>
      <BottomNav />
      <NavigationTracker />
    </div>
  );
}
