import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import { Button } from "@/components/ui/button";
import { useLoan } from "@/context/LoanContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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
  // Verificar se estamos em uma rota de autenticação
  const isAuthRoute = location.startsWith("/auth");
  
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
    <header className="bg-card shadow-md z-10 border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2 text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-primary gradient-text hidden sm:block">
              LoanBuddy
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          {!isAuthRoute && <NotificationDropdown />}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center cursor-pointer">
                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-sm">
                  <span className="text-sm font-medium">{getUserInitials()}</span>
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">
                  {user?.email || "Usuário"}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Minha Conta</p>
                  <p className="text-xs text-muted-foreground">{user?.email || "Usuário"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
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
