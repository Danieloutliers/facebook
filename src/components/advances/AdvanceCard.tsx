import { format } from "date-fns";
import { Link } from "wouter";
import { MoreHorizontal, Clock, AlertTriangle, DollarSign, Plus } from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { AdvanceType, BorrowerType } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdvanceCardProps {
  borrower: BorrowerType;
  advances: AdvanceType[];
  totalAmount: number;
  overdueCount: number;
  nextDueDate?: string;
}

export default function AdvanceCard({ 
  borrower, 
  advances, 
  totalAmount, 
  overdueCount,
  nextDueDate
}: AdvanceCardProps) {
  const { settings } = useLoan();
  
  // Gerar iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2 flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className="bg-primary/20 text-primary">
              {getInitials(borrower.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-lg">{borrower.name}</h3>
            <p className="text-sm text-muted-foreground">
              {advances.length} adiantamento{advances.length !== 1 ? "s" : ""} ativo{advances.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/borrowers/${borrower.id}`}>
                Ver perfil do mutuário
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/advances/new">
                Registrar novo adiantamento
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total em adiantamentos</p>
            <p className="text-2xl font-bold">
              {settings.currency} {totalAmount.toFixed(2)}
            </p>
          </div>
          
          {overdueCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overdueCount} atrasado{overdueCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        
        {/* Lista de adiantamentos recentes */}
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium border-b pb-1">Adiantamentos ativos</h4>
          <ul className="space-y-2 max-h-36 overflow-y-auto">
            {advances.map(advance => (
              <li key={advance.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{settings.currency} {Number(advance.amount).toFixed(2)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-2">
                    Vence: {format(new Date(advance.dueDate), "dd/MM/yyyy")}
                  </span>
                  <Button size="sm" variant="ghost" asChild className="h-6 px-2">
                    <Link href={`/advances/${advance.id}`}>
                      Detalhes
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {nextDueDate && (
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>Próximo vencimento: {format(new Date(nextDueDate), "dd/MM/yyyy")}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 pb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/borrowers/${borrower.id}`}>
            Ver perfil
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/advances/new">
            <Plus className="h-4 w-4 mr-1" /> Adiantamento
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}