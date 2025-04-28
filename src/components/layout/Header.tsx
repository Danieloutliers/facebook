import { useState } from "react";
import { Menu, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoan } from "@/context/LoanContext";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "./Sidebar";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [location, navigate] = useLocation();
  const pageTitle = getPageTitle(location);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um problema ao tentar sair do sistema",
        variant: "destructive",
      });
    }
  };
  
  // Obter as iniciais do usuário para exibir no avatar
  const getUserInitials = () => {
    if (!user || !user.email) return "?";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2 text-slate-500"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <h2 className="text-lg font-semibold text-slate-900">{pageTitle}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-slate-500">
            <Bell className="h-6 w-6" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="text-sm font-medium">{getUserInitials()}</span>
                </div>
                <span className="ml-2 text-sm font-medium text-slate-700 hidden sm:block">
                  {user?.email || "Usuário"}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
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
