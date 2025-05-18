import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLoan } from "@/context/LoanContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CalendarIcon, 
  ArrowLeft, 
  User, 
  DollarSign, 
  Clock, 
  CalendarDays, 
  PlusCircle,
  Loader2,
  StickyNote,
  CheckCircle2
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export default function NewAdvance() {
  const [, params] = useRoute("/advances/new");
  const [, navigate] = useLocation();
  const { borrowers, advances, addAdvance, settings } = useLoan();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados do formulário
  const [borrowerId, setBorrowerId] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 30)); // Default: 30 dias
  const [fee, setFee] = useState("0");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formValid, setFormValid] = useState(false);
  
  // Pegar parâmetros de URL (se houver)
  useEffect(() => {
    // Simular carregamento
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Parse URL query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const borrowerIdParam = searchParams.get('borrowerId');
    
    if (borrowerIdParam && borrowers.some(b => b.id === borrowerIdParam)) {
      setBorrowerId(borrowerIdParam);
    }

    return () => clearTimeout(loadingTimer);
  }, [borrowers]);
  
  // Validar formulário
  useEffect(() => {
    const errors: Record<string, string> = {};
    
    if (!borrowerId) {
      errors.borrowerId = "Selecione um mutuário";
    }
    
    if (!amount || Number(amount) <= 0) {
      errors.amount = "Informe um valor válido";
    }
    
    if (!issueDate) {
      errors.issueDate = "Selecione a data de emissão";
    }
    
    if (!dueDate) {
      errors.dueDate = "Selecione a data de vencimento";
    } else if (dueDate < issueDate) {
      errors.dueDate = "A data de vencimento deve ser posterior à data de emissão";
    }
    
    setFormErrors(errors);
    setFormValid(Object.keys(errors).length === 0);
  }, [borrowerId, amount, issueDate, dueDate]);
  
  // Obter dados do mutuário selecionado
  const selectedBorrower = borrowers.find(b => b.id === borrowerId);
  
  // Calcular adiantamentos ativos do mutuário selecionado
  const activeAdvances = selectedBorrower 
    ? advances.filter(a => a.borrowerId === selectedBorrower.id && a.status === 'active')
    : [];
  
  const totalActiveAdvances = activeAdvances.reduce(
    (sum, advance) => sum + Number(advance.amount), 0
  );
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValid) {
      // Highlight errors
      return;
    }
    
    setIsSubmitting(true);
    
    const advanceData = {
      borrowerId,
      amount: Number(amount),
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      fee: fee ? Number(fee) : 0,
      notes,
    };
    
    try {
      addAdvance(advanceData);
      
      // Simular processamento
      setTimeout(() => {
        navigate("/advances");
      }, 800);
    } catch (error) {
      console.error("Erro ao criar adiantamento:", error);
      setIsSubmitting(false);
    }
  };
  
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
    <div className="max-w-4xl mx-auto">
      {/* Botão voltar */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="pl-0 text-muted-foreground hover:text-foreground" 
          onClick={() => navigate("/advances")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para adiantamentos
        </Button>
      </div>
      
      {/* Título da página */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Novo Adiantamento</h1>
        <p className="text-muted-foreground">
          Registre um novo adiantamento para um cliente existente
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário principal */}
        <div className="lg:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5 text-primary" /> 
                Informações do Adiantamento
              </CardTitle>
              <CardDescription>
                Preencha os dados abaixo para registrar um novo adiantamento
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <form id="advance-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Mutuário */}
                  <div className="space-y-2">
                    <Label htmlFor="borrowerId" className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" /> Mutuário
                    </Label>
                    <Select
                      value={borrowerId}
                      onValueChange={setBorrowerId}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger 
                        id="borrowerId"
                        className={formErrors.borrowerId ? "border-destructive ring-destructive" : ""}
                      >
                        <SelectValue placeholder="Selecione um mutuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {borrowers.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            Nenhum mutuário cadastrado
                          </div>
                        ) : (
                          borrowers.map((borrower) => (
                            <SelectItem key={borrower.id} value={borrower.id}>
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className={`text-xs ${getAvatarColor(borrower.name)}`}>
                                    {getInitials(borrower.name)}
                                  </AvatarFallback>
                                </Avatar>
                                {borrower.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formErrors.borrowerId && (
                      <p className="text-sm text-destructive mt-1">{formErrors.borrowerId}</p>
                    )}
                  </div>

                  {/* Valores */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Valor */}
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" /> Valor
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">
                          {settings?.currency || "R$"}
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          step="0.01"
                          min="0"
                          className={`pl-8 ${formErrors.amount ? "border-destructive" : ""}`}
                          disabled={isSubmitting}
                          required
                        />
                      </div>
                      {formErrors.amount && (
                        <p className="text-sm text-destructive mt-1">{formErrors.amount}</p>
                      )}
                    </div>

                    {/* Taxa */}
                    <div className="space-y-2">
                      <Label htmlFor="fee" className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" /> Taxa (opcional)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">
                          {settings?.currency || "R$"}
                        </span>
                        <Input
                          id="fee"
                          type="number"
                          value={fee}
                          onChange={(e) => setFee(e.target.value)}
                          step="0.01"
                          min="0"
                          className="pl-8"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Data de emissão */}
                    <div className="space-y-2">
                      <Label htmlFor="issueDate" className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /> Data de emissão
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${formErrors.issueDate ? "border-destructive" : ""}`}
                            id="issueDate"
                            disabled={isSubmitting}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {issueDate ? format(issueDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={issueDate}
                            onSelect={(date) => date && setIssueDate(date)}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      {formErrors.issueDate && (
                        <p className="text-sm text-destructive mt-1">{formErrors.issueDate}</p>
                      )}
                    </div>

                    {/* Data de vencimento */}
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" /> Data de vencimento
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${formErrors.dueDate ? "border-destructive" : ""}`}
                            id="dueDate"
                            disabled={isSubmitting}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-2 border-b">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => setDueDate(addDays(new Date(), 7))}
                                type="button"
                              >
                                +7 dias
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => setDueDate(addDays(new Date(), 15))}
                                type="button"
                              >
                                +15 dias
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => setDueDate(addDays(new Date(), 30))}
                                type="button"
                              >
                                +30 dias
                              </Button>
                            </div>
                          </div>
                          <Calendar
                            mode="single"
                            selected={dueDate}
                            onSelect={(date) => date && setDueDate(date)}
                            defaultMonth={dueDate}
                            initialFocus
                            fromDate={new Date()}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      {formErrors.dueDate && (
                        <p className="text-sm text-destructive mt-1">{formErrors.dueDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center">
                      <StickyNote className="h-4 w-4 mr-2 text-muted-foreground" /> Observações
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre o adiantamento..."
                      disabled={isSubmitting}
                      className="min-h-[120px]"
                    />
                  </div>
                </form>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between pt-2 border-t bg-muted/5">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/advances")}
                disabled={isSubmitting || isLoading}
              >
                Cancelar
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        type="submit"
                        form="advance-form"
                        disabled={!formValid || isSubmitting || isLoading}
                        className="min-w-32"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Registrar Adiantamento
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!formValid && (
                    <TooltipContent>
                      <p>Preencha todos os campos obrigatórios</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        </div>
        
        {/* Sidebar com informações do cliente */}
        <div className="lg:col-span-1">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-muted/50 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted/60 animate-pulse rounded-md"></div>
                      <div className="h-3 w-24 bg-muted/40 animate-pulse rounded-md"></div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted/60 animate-pulse rounded-md"></div>
                    <div className="h-6 w-24 bg-muted/60 animate-pulse rounded-md"></div>
                  </div>
                </div>
              ) : selectedBorrower ? (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar>
                      <AvatarFallback className={getAvatarColor(selectedBorrower.name)}>
                        {getInitials(selectedBorrower.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedBorrower.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeAdvances.length} adiantamento{activeAdvances.length !== 1 ? "s" : ""} ativo{activeAdvances.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total em adiantamentos ativos</p>
                      <p className="text-xl font-bold">
                        {settings?.currency || "R$"} {totalActiveAdvances.toFixed(2)}
                      </p>
                    </div>
                    
                    {activeAdvances.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-3">Adiantamentos ativos</h4>
                          <ul className="space-y-2">
                            {activeAdvances.map(advance => (
                              <li key={advance.id} className="flex justify-between text-sm">
                                <Badge variant="outline" className="font-mono">
                                  {settings?.currency || "R$"} {Number(advance.amount).toFixed(2)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Vence em {format(new Date(advance.dueDate), "dd/MM/yyyy")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                    
                    {selectedBorrower.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p>{selectedBorrower.phone}</p>
                      </div>
                    )}
                    
                    {selectedBorrower.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{selectedBorrower.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="text-muted-foreground font-medium mb-2">Nenhum cliente selecionado</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione um cliente para ver suas informações
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}