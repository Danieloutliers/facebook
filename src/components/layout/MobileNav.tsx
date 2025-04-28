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
    <div className="bg-white w-full border-t border-slate-200 fixed bottom-0 md:hidden z-50">
      <div className="flex justify-around">
        <NavItem
          href="/"
          icon={LayoutDashboard}
          label="Dashboard"
          active={isDashboard}
        />
        <NavItem
          href="/loans"
          icon={CreditCard}
          label="Empréstimos"
          active={isLoans}
        />
        <NavItem
          href="/borrowers"
          icon={Users}
          label="Mutuários"
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
        "flex flex-col items-center p-2",
        active ? "text-primary" : "text-slate-500"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs">{label}</span>
    </Link>
  );
}
