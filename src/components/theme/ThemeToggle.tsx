import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full w-9 h-9"
      title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
    >
      {theme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-slate-700" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-300" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
