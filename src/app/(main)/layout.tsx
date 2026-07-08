import { AppHeader } from "@/components/app-shell/app-header";
import { BottomNavigation } from "@/components/app-shell/bottom-navigation";

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Make the app shell a fixed-height column so header/footer stay in place
    // while the `main` area becomes the scrollable region on small screens.
    <div className="mx-auto h-screen max-w-[430px] bg-background/70 shadow-[0_0_0_1px_rgba(75,65,58,0.08)] sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[28px] flex flex-col">
      <AppHeader />
      <main
        className="flex-1 overflow-auto pb-[calc(8rem+env(safe-area-inset-bottom))]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
