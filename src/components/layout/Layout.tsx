import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const title = getPageTitle(location);

  return (
    <div className="bg-slate-50 text-slate-900 h-screen flex overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />

        {/* Main content with scrolling */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-50 pb-16 md:pb-4">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
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
