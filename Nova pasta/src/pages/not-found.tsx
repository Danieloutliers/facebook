import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="text-center mb-8">
        <h1 className="text-9xl font-bold title-gradient mb-3">404</h1>
        <p className="text-xl font-medium text-muted-foreground">Página não encontrada</p>
      </div>
      
      <Card className="w-full max-w-md mx-4 border-border shadow-md">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center mb-4 gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-semibold text-foreground">Ops! Esta página não existe</h2>
          </div>

          <p className="mb-6 text-muted-foreground">
            A página que você está procurando pode ter sido removida, renomeada 
            ou está temporariamente indisponível.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline" 
              className="flex-1"
            >
              Voltar
            </Button>
            <Button 
              asChild
              className="flex-1 btn-gradient"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Ir para o Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
