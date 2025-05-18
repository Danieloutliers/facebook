import { useState, useEffect } from "react";
import { Link } from "wouter";
import { format, addDays, isBefore, isAfter } from "date-fns";
import { 
  Plus, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  DollarSign, 
  Search, 
  ArrowUpRight, 
  Users, 
  CheckCircle2,
  ArrowRight, 
  Filter 
} from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdvanceList() {
  const { borrowers, advances, getOverdueAdvances, settings } = useLoan();
  const [searchTerm, setSearchTerm] = useState("");
  const [tabValue, setTabValue] = useState("cards");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento dos dados
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Calcular os adiantamentos em atraso
  const overdueAdvances = getOverdueAdvances ? getOverdueAdvances() : [];
  
  // Calcular adiantamentos que vencem nos próximos 7 dias
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  const upcomingAdvances = advances ? advances.filter(advance => {
    const dueDate = new Date(advance.dueDate);
    return advance.status === 'active' && 
           isAfter(dueDate, today) && 
           isBefore(dueDate, nextWeek);
  }) : [];
  
  const upcomingTotal = upcomingAdvances.reduce(
    (sum, advance) => sum + Number(advance.amount), 0
  );

  // Agrupar adiantamentos por mutuário para exibir nos cards
  const borrowersWithAdvances = borrowers
    .filter(borrower => {
      // Filtrar por nome do mutuário se houver termo de pesquisa
      if (searchTerm && !borrower.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Verificar se o mutuário tem pelo menos um adiantamento ativo
      const hasActiveAdvances = advances && advances.some(
        advance => advance.borrowerId === borrower.id && 
          (filterStatus === "all" ? 
            advance.status === 'active' : 
            advance.status === 'active' && 
            (filterStatus === "overdue" ? 
              new Date(advance.dueDate) < today : 
              new Date(advance.dueDate) >= today)
          )
      );
      
      return hasActiveAdvances;
    })
    .map(borrower => {
      // Obter todos os adiantamentos deste mutuário
      const borrowerAdvances = advances ? advances.filter(
        advance => advance.borrowerId === borrower.id && 
          (filterStatus === "all" ? 
            advance.status === 'active' : 
            advance.status === 'active' && 
            (filterStatus === "overdue" ? 
              new Date(advance.dueDate) < today : 
              new Date(advance.dueDate) >= today)
          )
      ) : [];
      
      // Total de adiantamentos deste mutuário
      const totalAmount = borrowerAdvances.reduce(
        (sum, advance) => sum + Number(advance.amount), 
        0
      );
      
      // Adiantamentos em atraso
      const overdue = borrowerAdvances.filter(
        advance => new Date(advance.dueDate) < today
      );
      
      // Próximo adiantamento a vencer
      const nextDue = borrowerAdvances
        .filter(advance => new Date(advance.dueDate) > today)
        .sort((a, b) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )[0];
      
      return {
        borrower,
        advances: borrowerAdvances,
        totalAmount,
        overdueCount: overdue.length,
        nextDueDate: nextDue?.dueDate,
        latestAdvanceDate: borrowerAdvances.length > 0 ? 
          new Date(Math.max(...borrowerAdvances.map(a => new Date(a.issueDate).getTime()))) : 
          new Date(0)
      };
    });

  // Aplicar ordenação
  const sortedBorrowers = [...borrowersWithAdvances].sort((a, b) => {
    if (sortOrder === "newest") {
      return b.latestAdvanceDate.getTime() - a.latestAdvanceDate.getTime();
    } else if (sortOrder === "amount") {
      return b.totalAmount - a.totalAmount;
    } else if (sortOrder === "name") {
      return a.borrower.name.localeCompare(b.borrower.name);
    } else if (sortOrder === "overdue") {
      return b.overdueCount - a.overdueCount;
    }
    return 0;
  });

  // Gerar iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Obter cor de avatar baseada no nome (para consistência)
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-100 text-red-800",
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-yellow-100 text-yellow-800",
      "bg-indigo-100 text-indigo-800",
      "bg-pink-100 text-pink-800",
      "bg-teal-100 text-teal-800"
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="p-6 -mx-5 -mt-5 mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Adiantamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os adiantamentos em um único lugar - visualize por cliente, acompanhe vencimentos e registre novos valores.
          </p>
        </div>
      </div>

      {/* Ações e pesquisa */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex space-x-2">
          <Button asChild variant="default" size="default" className="shadow-sm">
            <Link href="/advances/new">
              <Plus className="mr-2 h-4 w-4" /> Novo Adiantamento
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <h4 className="mb-2 text-sm font-medium">Ordenar por</h4>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a ordem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="amount">Maior valor</SelectItem>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="overdue">Mais atrasados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <h4 className="mb-2 text-sm font-medium">Filtrar por</h4>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o filtro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="upcoming">Em dia</SelectItem>
                    <SelectItem value="overdue">Atrasados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="relative">
          <div className="flex items-center border rounded-md px-3 focus-within:ring-1 focus-within:ring-primary">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Widgets informativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de adiantamentos */}
        <Card className="border-none shadow-md bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">Total de Adiantamentos</CardTitle>
              <p className="text-sm text-muted-foreground">Adiantamentos ativos</p>
            </div>
            <div className="rounded-full bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-7 w-24 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-2xl font-bold">
                {settings?.currency || "R$"} {(advances?.reduce((sum, a) => sum + Number(a.amount), 0) || 0).toFixed(2)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {isLoading ? (
                <div className="h-4 w-20 bg-muted/60 animate-pulse rounded-md"></div>
              ) : (
                <>
                  <Users className="h-3 w-3 mr-1" />
                  {borrowersWithAdvances.length} clientes | {advances?.filter(a => a.status === 'active').length || 0} adiantamentos
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Próximos vencimentos */}
        <Card className="border-none shadow-md bg-gradient-to-br from-background to-orange-50 dark:to-orange-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">Próximos Vencimentos</CardTitle>
              <p className="text-sm text-muted-foreground">Vencimentos em 7 dias</p>
            </div>
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-2">
              <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-7 w-24 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-2xl font-bold">
                {settings?.currency || "R$"} {upcomingTotal.toFixed(2)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {isLoading ? (
                <div className="h-4 w-20 bg-muted/60 animate-pulse rounded-md"></div>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  {upcomingAdvances.length} adiantamento{upcomingAdvances.length !== 1 ? "s" : ""} a vencer
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Adiantamentos em atraso */}
        <Card className="border-none shadow-md bg-gradient-to-br from-background to-red-50 dark:to-red-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-medium">Adiantamentos em Atraso</CardTitle>
              <p className="text-sm text-muted-foreground">Pagamentos pendentes</p>
            </div>
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-7 w-24 bg-muted/60 animate-pulse rounded-md"></div>
            ) : (
              <div className="text-2xl font-bold">
                {settings?.currency || "R$"} {(overdueAdvances?.reduce((sum, a) => sum + Number(a.amount), 0) || 0).toFixed(2)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {isLoading ? (
                <div className="h-4 w-20 bg-muted/60 animate-pulse rounded-md"></div>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {overdueAdvances?.length || 0} adiantamento{overdueAdvances?.length !== 1 ? "s" : ""} em atraso
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Separador com título */}
      <div className="flex items-center my-8">
        <h2 className="text-xl font-semibold">Clientes com Adiantamentos</h2>
        <Separator className="flex-1 ml-4" />
      </div>

      {/* Tabs para alternar entre visualizações */}
      <Tabs 
        defaultValue="cards" 
        value={tabValue} 
        onValueChange={setTabValue} 
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-56 grid-cols-2">
            <TabsTrigger value="cards" className="rounded-md">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Cards
              </div>
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-md">
              <div className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2" />
                Lista
              </div>
            </TabsTrigger>
          </TabsList>
          
          <div className="text-sm text-muted-foreground">
            {sortedBorrowers.length} resultado{sortedBorrowers.length !== 1 ? "s" : ""}
          </div>
        </div>
        
        {/* Cards view */}
        <TabsContent value="cards" className="mt-2">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <CardHeader className="pb-2 bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted/50"></div>
                      <div>
                        <div className="h-5 w-32 bg-muted/50 rounded-md"></div>
                        <div className="h-4 w-24 bg-muted/40 rounded-md mt-2"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="h-5 w-40 bg-muted/40 rounded-md"></div>
                      <div className="h-7 w-28 bg-muted/50 rounded-md"></div>
                      <div className="h-4 w-full bg-muted/30 rounded-md"></div>
                      <div className="h-4 w-full bg-muted/30 rounded-md"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedBorrowers.length === 0 ? (
            <Card className="text-center p-8 border-dashed border-2 bg-muted/5">
              <CardContent className="pt-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhum adiantamento encontrado</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm ? 
                    `Não encontramos resultados para "${searchTerm}". Tente outro termo de pesquisa.` : 
                    filterStatus !== "all" ? 
                      `Não há adiantamentos ${filterStatus === "overdue" ? "atrasados" : "em dia"} no momento.` :
                      "Não há adiantamentos ativos no momento. Crie seu primeiro adiantamento para começar."
                  }
                </p>
                <Button asChild>
                  <Link href="/advances/new">
                    <Plus className="mr-2 h-4 w-4" /> Criar adiantamento
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedBorrowers.map(({ borrower, advances, totalAmount, overdueCount, nextDueDate }) => (
                <Card key={borrower.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-t-4 border-t-primary/20">
                  <CardHeader className="pb-2 flex-row items-center justify-between bg-background">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className={getAvatarColor(borrower.name)}>
                          {getInitials(borrower.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-lg truncate max-w-[170px]">{borrower.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {advances.length} adiantamento{advances.length !== 1 ? "s" : ""} ativo{advances.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/borrowers/${borrower.id}`}>Ver perfil do cliente</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/advances/new?borrowerId=${borrower.id}`}>Adicionar adiantamento</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total em adiantamentos</p>
                        <p className="text-2xl font-bold">
                          {settings?.currency || "R$"} {totalAmount.toFixed(2)}
                        </p>
                      </div>
                      
                      {overdueCount > 0 ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {overdueCount} atrasado{overdueCount !== 1 ? "s" : ""}
                        </Badge>
                      ) : advances.some(a => a.status === 'active') ? (
                        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Em dia
                        </Badge>
                      ) : null}
                    </div>
                    
                    {/* Lista de adiantamentos recentes */}
                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-medium border-b pb-1">Adiantamentos ativos</h4>
                      <ul className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                        {advances.map(advance => (
                          <li key={advance.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-muted/40 rounded-md transition-colors">
                            <span className="font-medium">{(settings?.currency || "R$")} {Number(advance.amount).toFixed(2)}</span>
                            <div className="flex flex-col items-end">
                              <span className={`text-xs ${isBefore(new Date(advance.dueDate), today) ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {isBefore(new Date(advance.dueDate), today) ? 'Vencido: ' : 'Vence: '}
                                {format(new Date(advance.dueDate), "dd/MM/yyyy")}
                              </span>
                              <Link href={`/advances/${advance.id}`} className="text-xs text-primary hover:underline mt-0.5">
                                Detalhes
                              </Link>
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
                  
                  <CardFooter className="flex justify-between pt-2 pb-4 bg-muted/5">
                    <Button variant="ghost" size="sm" asChild className="text-primary">
                      <Link href={`/borrowers/${borrower.id}`}>
                        Ver perfil
                      </Link>
                    </Button>
                    <Button size="sm" asChild className="bg-primary/90 hover:bg-primary">
                      <Link href={`/advances/new?borrowerId=${borrower.id}`}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adiantamento
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* List view */}
        <TabsContent value="list" className="mt-2">
          <Card className="border shadow-sm">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-8 bg-muted/30 rounded-md w-full"></div>
                  </div>
                ))}
              </div>
            ) : advances?.filter(a => a.status === 'active').length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum adiantamento ativo para exibir.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left p-3 font-medium text-muted-foreground">Mutuário</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Valor</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Data Emissão</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Data Vencimento</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances && advances
                      .filter(advance => {
                        const matchesSearch = !searchTerm || 
                          (advance.borrowerName && advance.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()));
                        
                        const matchesFilter = filterStatus === "all" ? 
                          advance.status === 'active' : 
                          advance.status === 'active' && 
                          (filterStatus === "overdue" ? 
                            new Date(advance.dueDate) < today : 
                            new Date(advance.dueDate) >= today);
                        
                        return matchesSearch && matchesFilter;
                      })
                      .sort((a, b) => {
                        if (sortOrder === "newest") {
                          return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
                        } else if (sortOrder === "amount") {
                          return Number(b.amount) - Number(a.amount);
                        } else if (sortOrder === "name") {
                          return a.borrowerName.localeCompare(b.borrowerName);
                        } else if (sortOrder === "overdue") {
                          const aIsOverdue = new Date(a.dueDate) < today ? 1 : 0;
                          const bIsOverdue = new Date(b.dueDate) < today ? 1 : 0;
                          return bIsOverdue - aIsOverdue;
                        }
                        return 0;
                      })
                      .map(advance => (
                        <tr key={advance.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">
                            <Link href={`/borrowers/${advance.borrowerId}`} className="hover:text-primary">
                              {advance.borrowerName}
                            </Link>
                          </td>
                          <td className="p-3 font-mono">
                            {settings?.currency || "R$"} {Number(advance.amount).toFixed(2)}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {format(new Date(advance.issueDate), "dd/MM/yyyy")}
                          </td>
                          <td className="p-3">
                            {format(new Date(advance.dueDate), "dd/MM/yyyy")}
                          </td>
                          <td className="p-3">
                            {new Date(advance.dueDate) < new Date() ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-3.5 w-3.5" /> 
                                Atrasado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit bg-green-50 text-green-700 border-green-200">
                                <Clock className="h-3.5 w-3.5" /> 
                                Em dia
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="sm" asChild className="text-primary">
                              <Link href={`/advances/${advance.id}`}>
                                Detalhes <ArrowRight className="h-3.5 w-3.5 ml-1" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Estilo para scrollbar personalizado */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 100vh;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
        }
      `}</style>
    </div>
  );
}