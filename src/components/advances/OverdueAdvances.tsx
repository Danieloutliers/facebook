import { format, isBefore } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OverdueAdvances() {
  const { advances, settings } = useLoan();
  
  // Data atual
  const today = new Date();
  
  // Filtrar adiantamentos em atraso
  const overdueAdvances = advances.filter(advance => {
    const dueDate = new Date(advance.dueDate);
    return (
      advance.status === 'active' &&
      isBefore(dueDate, today)
    );
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const totalOverdueAmount = overdueAdvances.reduce(
    (sum, advance) => sum + Number(advance.amount),
    0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Adiantamentos Atrasados</CardTitle>
          <CardDescription>Adiantamentos com pagamentos em atraso</CardDescription>
        </div>
        <div className="rounded-full bg-destructive/10 p-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-1">
          <div className="text-2xl font-bold">
            {settings.currency} {totalOverdueAmount.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {overdueAdvances.length} adiantamento{overdueAdvances.length !== 1 ? "s" : ""} atrasado{overdueAdvances.length !== 1 ? "s" : ""}
          </p>
        </div>
        
        {/* Lista de adiantamentos atrasados */}
        {overdueAdvances.length > 0 && (
          <div className="mt-4 space-y-2">
            {overdueAdvances.slice(0, 3).map(advance => (
              <div key={advance.id} className="flex justify-between items-center text-sm border-b pb-2">
                <div className="flex-1">
                  <p className="font-medium truncate">{advance.borrowerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.currency} {Number(advance.amount).toFixed(2)}
                  </p>
                </div>
                <Badge variant="destructive" className="ml-2">
                  {format(new Date(advance.dueDate), "dd/MM")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}