import { Link, useRoute } from "wouter";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  // Using separate hooks for each route pattern
  const [isDashboard] = useRoute("/");
  const [isLoans] = useRoute("/loans*");
  const [isBorrowers] = useRoute("/borrowers*");
  const [isPayments] = useRoute("/payments*");
  const [isReports] = useRoute("/reports*");
  const [isSettings] = useRoute("/settings*");
  
  // Calculate "more" section active state
  const isMoreActive = isPayments || isReports || isSettings;

  return (
    <div className="bg-card shadow-lg border-t border-border fixed bottom-0 md:hidden z-50 w-full">
      <div className="flex justify-around py-1">
        <NavItem
          href="/"
          icon={LayoutDashboard}
          label="Dashboard"
          active={isDashboard}
        />
        <NavItem
          href="/loans"
          icon={CreditCard}
          label="Contratos"
          active={isLoans}
        />
        <NavItem
          href="/borrowers"
          icon={Users}
          label="Clientes"
          active={isBorrowers}
        />
        <NavItem
          href="/settings"
          icon={MoreHorizontal}
          label="Mais"
          active={isMoreActive}
        />
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  active: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex flex-col items-center py-2 px-1",
        active 
          ? "text-primary relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-0.5 after:bg-primary after:rounded-full" 
          : "text-muted-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5 mb-1", active && "text-primary")} />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
