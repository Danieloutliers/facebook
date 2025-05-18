import { DollarSign } from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdvanceSummary() {
  const { advances, settings } = useLoan();
  
  // Filtramos apenas os adiantamentos ativos
  const activeAdvances = advances.filter(advance => advance.status === 'active');
  
  // Calculamos o total de adiantamentos ativos
  const totalActiveAmount = activeAdvances.reduce(
    (sum, advance) => sum + Number(advance.amount), 
    0
  );
  
  // Calculamos o número de mutuários com adiantamentos ativos
  const uniqueBorrowers = new Set(
    activeAdvances.map(advance => advance.borrowerId)
  );
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Total de Adiantamentos</CardTitle>
          <CardDescription>Adiantamentos ativos no sistema</CardDescription>
        </div>
        <div className="rounded-full bg-primary/10 p-2">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-1">
          <div className="text-2xl font-bold">
            {settings.currency} {totalActiveAmount.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeAdvances.length} adiantamento{activeAdvances.length !== 1 ? "s" : ""} 
            {" "}para {uniqueBorrowers.size} mutuário{uniqueBorrowers.size !== 1 ? "s" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}