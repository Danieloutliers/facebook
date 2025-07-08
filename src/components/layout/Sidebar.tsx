
import { Link, useRoute } from "wouter";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  DollarSign,
  FileBarChart,
  Settings,
  BookOpen,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OfflineIndicator } from "@/components/OfflineIndicator";

interface SidebarProps {
  onItemClick?: () => void;
}

export default function Sidebar({ onItemClick }: SidebarProps) {
  const isActive = (pattern: string) => {
    const [match] = useRoute(pattern);
    return match;
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/loans", label: "Contratos", icon: CreditCard, exact: false },
    { href: "/borrowers", label: "Clientes", icon: Users, exact: false },
    { href: "/payments", label: "Pagamentos", icon: DollarSign, exact: false },
    { href: "/reports", label: "Relatórios", icon: FileBarChart, exact: false },
    { href: "/how-to-use", label: "Como Usar", icon: BookOpen, exact: false },
    { href: "/settings", label: "Configurações", icon: Settings, exact: false },
  ];

  return (
    <div className="w-64 h-full flex-shrink-0 md:block relative">
      <div className="p-5">
        <div className="logo-container">
          <div className="logo-icon">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div className="logo-text">LoanBuddy</div>
        </div>
      </div>
      <nav className="px-3 py-4">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const active = isActive(item.exact ? item.href : `${item.href}*`);
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg font-medium transition-all duration-150 ease-in-out",
                    active
                      ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 mr-3",
                    active ? "text-primary" : "text-muted-foreground"
                  )} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="px-3 mt-8">
        <div className="p-4 rounded-lg bg-muted">
          <h3 className="text-sm font-medium mb-2">Precisa de ajuda?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Acesse nossa documentação para tirar dúvidas sobre o sistema.
          </p>
          <Link 
            href="/settings"
            onClick={onItemClick}
            className="text-xs text-primary font-medium flex items-center hover:underline"
          >
            Ver documentação
            <span className="ml-1">→</span>
          </Link>
        </div>
      </div>
      
      {/* Indicador de status offline */}
      <div className="absolute bottom-4 left-3 right-3">
        <OfflineIndicator />
      </div>
    </div>
  );
}
