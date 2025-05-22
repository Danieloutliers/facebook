import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";
import OfflineIndicator from "./OfflineIndicator";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const title = getPageTitle(location);

  return (
    <div className="bg-background text-foreground h-screen flex overflow-hidden">
      {/* Sidebar for desktop */}
      <div className="modern-sidebar">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />

        {/* Main content with scrolling */}
        <main className="flex-1 overflow-y-auto p-5 pb-16 md:pb-5 bg-gradient-to-br from-background to-muted/50 dark:gradient-bg">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold title-gradient mb-6">{title}</h1>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}

// Helper function to get the page title based on the current route
function getPageTitle(path: string): string {
  if (path === "/") return "Dashboard";
  if (path.startsWith("/loans")) return "Empréstimos";
  if (path.startsWith("/borrowers")) return "Mutuários";
  if (path.startsWith("/payments")) return "Pagamentos";
  if (path.startsWith("/reports")) return "Relatórios";
  if (path.startsWith("/settings")) return "Configurações";
  return "LoanBuddy";
}
