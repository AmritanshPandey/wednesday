import { AppHeader } from "@/components/app-shell/app-header";
import { BottomNavigation } from "@/components/app-shell/bottom-navigation";

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background/70 shadow-[0_0_0_1px_rgba(75,65,58,0.08)] sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[28px]">
      <AppHeader />
      <main className="min-h-[calc(100vh-8rem)] pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNavigation />
    </div>
  );
}
