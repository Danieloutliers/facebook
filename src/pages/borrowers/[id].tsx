import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import StatusBadge from "@/components/shared/StatusBadge";
import BorrowerForm from "@/components/borrowers/BorrowerForm";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Edit, Trash2, Mail, Phone, User } from "lucide-react";

export default function BorrowerDetailsPage() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { getBorrowerById, getLoansByBorrowerId, deleteBorrower } = useLoan();
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  
  // Check if URL has edit=true query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1]);
    if (searchParams.get("edit") === "true") {
      setIsEditing(true);
    }
  }, [location]);
  
  if (!id) {
    return <div>ID do mutuário não fornecido</div>;
  }
  
  const borrower = getBorrowerById(id);
  
  if (!borrower) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Mutuário não encontrado</h3>
            <p className="mt-2 text-slate-500">
              O mutuário solicitado não existe ou foi removido.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setLocation("/borrowers")}
            >
              Voltar para Mutuários
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const borrowerLoans = getLoansByBorrowerId(borrower.id);
  
  // Count loans by status
  const activeLoanCount = borrowerLoans.filter(loan => loan.status === 'active').length;
  const paidLoanCount = borrowerLoans.filter(loan => loan.status === 'paid').length;
  const overdueLoanCount = borrowerLoans.filter(loan => loan.status === 'overdue').length;
  const defaultedLoanCount = borrowerLoans.filter(loan => loan.status === 'defaulted').length;
  
  // Calculate total borrowed and total paid
  const totalBorrowed = borrowerLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalActive = borrowerLoans
    .filter(loan => loan.status === 'active' || loan.status === 'overdue' || loan.status === 'defaulted')
    .reduce((sum, loan) => sum + loan.principal, 0);
  
  const handleDelete = () => {
    // Check if borrower has active loans
    if (activeLoanCount > 0 || overdueLoanCount > 0 || defaultedLoanCount > 0) {
      alert("Não é possível excluir um cliente com contratos ativos.");
      return;
    }
    
    deleteBorrower(borrower.id);
    setLocation("/borrowers");
  };
  
  if (isEditing) {
    return <BorrowerForm borrower={borrower} isEditing={true} />;
  }
  
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {borrower.name}
          </h1>
          <p className="text-slate-500">
            ID: {borrower.id}
          </p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente 
                  o cliente.
                  {activeLoanCount > 0 && (
                    <div className="mt-2 text-amber-600 font-semibold">
                      Este cliente possui {activeLoanCount} contrato(s) ativo(s) e 
                      não pode ser excluído.
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={activeLoanCount > 0}>
                  Sim, excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total Contratado</CardTitle>
            <div className="text-2xl font-semibold">{formatCurrency(totalBorrowed)}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-slate-500">
              <User className="h-4 w-4 mr-1" />
              {borrowerLoans.length} contrato(s) no total
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Contratos Ativos</CardTitle>
            <div className="text-2xl font-semibold">{formatCurrency(totalActive)}</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-slate-500">
              <User className="h-4 w-4 mr-1" />
              {activeLoanCount + overdueLoanCount + defaultedLoanCount} contrato(s) ativos
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Informações de Contato</CardTitle>
            <div className="text-lg font-semibold truncate">
              {borrower.phone || borrower.cpf || "Dados incompletos"}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {borrower.phone && (
              <div className="flex items-center text-slate-500">
                <Phone className="h-4 w-4 mr-1" />
                {borrower.phone}
              </div>
            )}
            {borrower.cpf && (
              <div className="flex items-center text-slate-500">
                <User className="h-4 w-4 mr-1" />
                CPF: {borrower.cpf}
              </div>
            )}
            {borrower.city && borrower.state && (
              <div className="flex items-center text-slate-500">
                <Mail className="h-4 w-4 mr-1" />
                {borrower.city}/{borrower.state}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-2">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="loans">Contratos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Pessoais */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Dados Pessoais</h3>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Nome</span>
                    <span className="font-medium">{borrower.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">CPF</span>
                    <span className="font-medium">{borrower.cpf || "Não informado"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">RG</span>
                    <span className="font-medium">{borrower.rg || "Não informado"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Profissão</span>
                    <span className="font-medium">{borrower.profession || "Não informado"}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">Renda Mensal</span>
                    <span className="font-medium">
                      {borrower.income ? formatCurrency(borrower.income) : "Não informado"}
                    </span>
                  </div>
                </div>

                {/* Informações de Contato */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Contato e Endereço</h3>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Telefone</span>
                    <span className="font-medium">{borrower.phone || "Não informado"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Endereço</span>
                    <span className="font-medium text-right max-w-[200px]">
                      {borrower.address || "Não informado"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Cidade</span>
                    <span className="font-medium">{borrower.city || "Não informado"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Estado</span>
                    <span className="font-medium">{borrower.state || "Não informado"}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">CEP</span>
                    <span className="font-medium">{borrower.zipCode || "Não informado"}</span>
                  </div>
                </div>

                {/* Resumo de Contratos */}
                <div className="space-y-3 md:col-span-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Resumo de Contratos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{borrowerLoans.length}</div>
                      <div className="text-sm text-slate-500">Total de Contratos</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{activeLoanCount}</div>
                      <div className="text-sm text-slate-500">Contratos Ativos</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{paidLoanCount}</div>
                      <div className="text-sm text-slate-500">Contratos Pagos</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{overdueLoanCount + defaultedLoanCount}</div>
                      <div className="text-sm text-slate-500">Contratos Vencidos</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-700">{formatCurrency(totalBorrowed)}</div>
                      <div className="text-sm text-blue-600">Total Contratado</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-700">{formatCurrency(totalActive)}</div>
                      <div className="text-sm text-green-600">Valor Ativo</div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {borrower.notes && (
                  <div className="space-y-3 md:col-span-2">
                    <h3 className="font-semibold text-lg border-b pb-2">Observações</h3>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-amber-800">{borrower.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Editar Informações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="loans" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contratos do Cliente</CardTitle>
              <CardDescription>
                Total de {borrowerLoans.length} contratos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Taxa</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {borrowerLoans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nenhum contrato encontrado para este cliente.
                          </TableCell>
                        </TableRow>
                      ) : (
                        borrowerLoans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell>{formatDate(loan.issueDate)}</TableCell>
                            <TableCell>{formatCurrency(loan.principal)}</TableCell>
                            <TableCell>{loan.interestRate}%</TableCell>
                            <TableCell>{formatDate(loan.dueDate)}</TableCell>
                            <TableCell>
                              <StatusBadge status={loan.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/loans/${loan.id}`}>
                                <Button variant="outline" size="sm">
                                  Detalhes
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Link href={`/loans/new`}>
                <Button>
                  Criar Novo Contrato
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
