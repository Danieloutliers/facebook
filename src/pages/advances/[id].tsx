import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Trash2, 
  CheckCircle2, 
  User, 
  Phone, 
  Mail, 
  AlertTriangle, 
  CalendarDays,
  Share2,
  Pencil,
  Loader2,
  StickyNote,
  Receipt
} from "lucide-react";
import { useLoan } from "@/context/LoanContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "wouter";

export default function AdvanceDetails() {
  const [, params] = useRoute("/advances/:id");
  const [, navigate] = useLocation();
  const { advances, borrowers, deleteAdvance, updateAdvance, settings } = useLoan();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMarkAsPaidDialog, setShowMarkAsPaidDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const advanceId = params?.id;
  const advance = advances?.find((a) => a.id === advanceId);
  const borrower = advance ? borrowers.find((b) => b.id === advance.borrowerId) : null;
  
  // Simular carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando detalhes do adiantamento...</p>
        </div>
      </div>
    );
  }

  if (!advance || !borrower) {
    return (
      <Card className="text-center p-8 border-dashed">
        <CardContent className="pt-6">
          <AlertTriangle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Adiantamento não encontrado</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            O adiantamento solicitado não existe ou foi removido. Verifique o link ou tente novamente.
          </p>
          <Button asChild>
            <Link href="/advances">Voltar para adiantamentos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = new Date(advance.dueDate) < new Date() && advance.status === 'active';
  const daysUntilDue = differenceInDays(new Date(advance.dueDate), new Date());
  const daysOverdue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;
  
  // Gerar iniciais do nome para o avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };
  
  // Obter cor de avatar baseada no nome
  const getAvatarColor = (name) => {
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

  // Função para excluir o adiantamento
  const handleDelete = () => {
    if (deleteAdvance) {
      setIsProcessing(true);
      // Simulação de processamento
      setTimeout(() => {
        deleteAdvance(advance.id);
        navigate("/advances");
      }, 500);
    }
  };

  // Função para marcar como pago
  const handleMarkAsPaid = () => {
    if (updateAdvance) {
      setIsProcessing(true);
      // Simulação de processamento
      setTimeout(() => {
        updateAdvance(advance.id, { status: "paid" });
        setShowMarkAsPaidDialog(false);
        setIsProcessing(false);
      }, 500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Botão de voltar */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/advances")}
          className="pl-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para adiantamentos
        </Button>
      </div>

      {/* Hero section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-background">
              <AvatarFallback className={getAvatarColor(borrower.name)}>
                {getInitials(borrower.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{borrower.name}</h1>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="mr-2">
                  Adiantamento #{advance.id.slice(0, 6)}
                </Badge>
                {advance.status === "active" && isOverdue ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> 
                    Atrasado ({daysOverdue} dia{daysOverdue !== 1 ? "s" : ""})
                  </Badge>
                ) : advance.status === "active" ? (
                  <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                    <Clock className="h-3.5 w-3.5" /> 
                    Em dia ({daysUntilDue} dia{daysUntilDue !== 1 ? "s" : ""} restantes)
                  </Badge>
                ) : advance.status === "paid" ? (
                  <Badge variant="outline" className="flex items-center gap-1 bg-primary/10 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 
                    Pago
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {advance.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 self-end">
            {advance.status === "active" && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={() => setShowMarkAsPaidDialog(true)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Marcar como pago
              </Button>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Esta ação não pode ser desfeita</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Sumário rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-background/80 p-4 rounded-md shadow-sm">
            <p className="text-sm text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" /> Valor do adiantamento
            </p>
            <p className="text-2xl font-bold">
              {settings?.currency || "R$"} {Number(advance.amount).toFixed(2)}
            </p>
          </div>
          
          <div className="bg-background/80 p-4 rounded-md shadow-sm">
            <p className="text-sm text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" /> Data de emissão
            </p>
            <p className="text-md font-medium">
              {format(new Date(advance.issueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          
          <div className="bg-background/80 p-4 rounded-md shadow-sm">
            <p className="text-sm text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" /> Data de vencimento
            </p>
            <p className={`text-md font-medium ${isOverdue ? "text-destructive" : ""}`}>
              {format(new Date(advance.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card com detalhes do adiantamento */}
        <div className="md:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-primary" />
                Detalhes do Adiantamento
              </CardTitle>
              <CardDescription>
                Informações completas sobre o adiantamento
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Valor */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" /> Valor principal
                  </p>
                  <p className="text-xl font-bold">
                    {settings?.currency || "R$"} {Number(advance.amount).toFixed(2)}
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-1" /> Status atual
                  </p>
                  <div className="flex items-center">
                    {advance.status === "active" && isOverdue ? (
                      <p className="text-destructive font-medium flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-1" /> Atrasado
                      </p>
                    ) : advance.status === "active" ? (
                      <p className="text-primary font-medium flex items-center">
                        <Clock className="h-5 w-5 mr-1" /> Ativo
                      </p>
                    ) : advance.status === "paid" ? (
                      <p className="text-green-600 font-medium flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-1" /> Pago
                      </p>
                    ) : (
                      <p className="text-muted-foreground font-medium flex items-center">
                        {advance.status}
                      </p>
                    )}
                  </div>
                </div>

                {/* Data de emissão */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1" /> Data de emissão
                  </p>
                  <p className="flex items-center">
                    {format(new Date(advance.issueDate), "dd/MM/yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(advance.issueDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>

                {/* Data de vencimento */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" /> Data de vencimento
                  </p>
                  <p className={`flex items-center ${isOverdue ? "text-destructive" : ""}`}>
                    {format(new Date(advance.dueDate), "dd/MM/yyyy")}
                  </p>
                  <p className={`text-xs ${isOverdue ? "text-destructive/70" : "text-muted-foreground"}`}>
                    {format(new Date(advance.dueDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>

                {/* Taxa */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" /> Taxa aplicada
                  </p>
                  <p className="flex items-center">
                    {settings?.currency || "R$"} {Number(advance.fee || 0).toFixed(2)}
                  </p>
                </div>
                
                {/* Valor total */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" /> Valor total
                  </p>
                  <p className="font-bold flex items-center">
                    {settings?.currency || "R$"} {(Number(advance.amount) + Number(advance.fee || 0)).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Principal + Taxa
                  </p>
                </div>
              </div>

              {/* Observações */}
              {advance.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center">
                      <StickyNote className="h-4 w-4 mr-1" /> Observações
                    </p>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{advance.notes}</p>
                    </div>
                  </div>
                </>
              )}
              
              {/* Ações disponíveis */}
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-primary" asChild>
                  <Link href={`/borrowers/${borrower.id}`}>
                    <User className="h-4 w-4 mr-2" /> Ver perfil completo
                  </Link>
                </Button>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/advances/new?borrowerId=${borrower.id}`}>
                    <DollarSign className="h-4 w-4 mr-2" /> Novo adiantamento
                  </Link>
                </Button>
                
                {advance.status === "active" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-muted-foreground"
                    disabled={true}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Editar (em breve)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Card com informações do cliente */}
        <div className="md:col-span-1">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <User className="h-4 w-4 mr-2 text-primary" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <Avatar>
                  <AvatarFallback className={getAvatarColor(borrower.name)}>
                    {getInitials(borrower.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{borrower.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Cliente desde {format(new Date(borrower.createdAt || '2023-01-01'), "MM/yyyy")}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {/* Contatos */}
              <div className="space-y-3">
                {borrower.phone && (
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{borrower.phone}</p>
                      <p className="text-xs text-muted-foreground">Telefone principal</p>
                    </div>
                  </div>
                )}
                
                {borrower.email && (
                  <div className="flex items-start">
                    <Mail className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{borrower.email}</p>
                      <p className="text-xs text-muted-foreground">Email de contato</p>
                    </div>
                  </div>
                )}
                
                {borrower.address && (
                  <div className="flex items-start">
                    <Share2 className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{borrower.address}</p>
                      <p className="text-xs text-muted-foreground">Endereço</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Contagem de adiantamentos */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Histórico do cliente</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 p-2 rounded-md text-center">
                    <p className="text-2xl font-bold text-primary">
                      {advances.filter(a => a.borrowerId === borrower.id).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Total adiantamentos</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-md text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {advances.filter(a => a.borrowerId === borrower.id && a.status === 'paid').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Pagos</p>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-2 pb-4 border-t">
              <Button asChild className="w-full">
                <Link href={`/borrowers/${borrower.id}`}>
                  Ver perfil completo
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir adiantamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este adiantamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> 
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmação para marcar como pago */}
      <AlertDialog open={showMarkAsPaidDialog} onOpenChange={setShowMarkAsPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar adiantamento como pago</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que este adiantamento de <strong>{settings?.currency || "R$"} {Number(advance.amount).toFixed(2)}</strong> para <strong>{borrower.name}</strong> foi pago integralmente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkAsPaid} 
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> 
                  Confirmar pagamento
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}