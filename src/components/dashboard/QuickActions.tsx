import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, BanknoteIcon, UserPlus, FileBarChart2 } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Novo Contrato",
      href: "/loans/new",
      icon: <Plus className="h-6 w-6" />,
      bgColor: "bg-primary-50 hover:bg-primary-100",
      iconBgColor: "bg-primary-100",
      iconColor: "text-primary",
    },
    {
      title: "Registrar Pagamento",
      href: "/payments",
      icon: <BanknoteIcon className="h-6 w-6" />,
      bgColor: "bg-emerald-50 hover:bg-emerald-100",
      iconBgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Novo Cliente",
      href: "/borrowers/new",
      icon: <UserPlus className="h-6 w-6" />,
      bgColor: "bg-indigo-50 hover:bg-indigo-100",
      iconBgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      title: "Gerar Relatório",
      href: "/reports",
      icon: <FileBarChart2 className="h-6 w-6" />,
      bgColor: "bg-amber-50 hover:bg-amber-100",
      iconBgColor: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <div className={`flex flex-col items-center p-4 rounded-lg transition-colors ${action.bgColor} cursor-pointer`}>
                <div className={`h-10 w-10 rounded-full ${action.iconBgColor} flex items-center justify-center ${action.iconColor} mb-3`}>
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-slate-900">{action.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
