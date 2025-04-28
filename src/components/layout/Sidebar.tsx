import { Link, useRoute } from "wouter";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  DollarSign,
  FileBarChart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  // Check if the current route matches the given pattern
  const isActive = (pattern: string) => {
    const [match] = useRoute(pattern);
    return match;
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/loans", label: "Empréstimos", icon: CreditCard, exact: false },
    { href: "/borrowers", label: "Mutuários", icon: Users, exact: false },
    { href: "/payments", label: "Pagamentos", icon: DollarSign, exact: false },
    { href: "/reports", label: "Relatórios", icon: FileBarChart, exact: false },
    { href: "/settings", label: "Configurações", icon: Settings, exact: false },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-primary flex items-center">
          <DollarSign className="h-6 w-6 mr-2" />
          LoanBuddy
        </h1>
      </div>
      <nav className="px-4 py-2">
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className="mb-2">
              <Link 
                href={item.href}
                className={cn(
                  "flex items-center px-2 py-2 rounded-md font-medium",
                  isActive(item.exact ? item.href : `${item.href}*`)
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
