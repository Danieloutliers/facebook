import { format, isAfter, isBefore, addDays } from "date-fns";
import { CalendarClock } from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UpcomingAdvances() {
  const { advances, settings } = useLoan();
  
  // Data atual
  const today = new Date();
  
  // Data daqui a 7 dias
  const nextWeek = addDays(today, 7);
  
  // Filtrar adiantamentos que vencem nos próximos 7 dias
  const upcomingAdvances = advances.filter(advance => {
    const dueDate = new Date(advance.dueDate);
    return (
      advance.status === 'active' &&
      isAfter(dueDate, today) &&
      isBefore(dueDate, nextWeek)
    );
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const totalUpcomingAmount = upcomingAdvances.reduce(
    (sum, advance) => sum + Number(advance.amount),
    0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Próximos Vencimentos</CardTitle>
          <CardDescription>Adiantamentos que vencem em 7 dias</CardDescription>
        </div>
        <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-2">
          <CalendarClock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-1">
          <div className="text-2xl font-bold">
            {settings.currency} {totalUpcomingAmount.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {upcomingAdvances.length} adiantamento{upcomingAdvances.length !== 1 ? "s" : ""} a vencer
          </p>
        </div>
        
        {/* Lista de adiantamentos próximos */}
        {upcomingAdvances.length > 0 && (
          <div className="mt-4 space-y-2">
            {upcomingAdvances.slice(0, 3).map(advance => (
              <div key={advance.id} className="flex justify-between items-center text-sm border-b pb-2">
                <div className="flex-1">
                  <p className="font-medium truncate">{advance.borrowerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.currency} {Number(advance.amount).toFixed(2)}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2">
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