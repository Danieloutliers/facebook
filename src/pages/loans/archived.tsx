import React, { useState } from "react";
import { 
  ArchiveIcon, 
  CalendarIcon, 
  SearchIcon 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/shared/StatusBadge";
import { useLoan } from "@/context/LoanContext";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ArchivedLoans() {
  const { getArchivedLoans } = useLoan();
  const [search, setSearch] = useState('');
  const archivedLoans = getArchivedLoans();

  // Garante que só empréstimos arquivados sejam exibidos
  const filteredLoans = archivedLoans.filter(loan => {
    console.log("Verificando empréstimo na página de arquivados:", loan);
    
    // Verificar se o empréstimo está arquivado
    const isArchived = loan.status === 'archived';
    
    // Filtrar pelo termo de busca
    const matchesSearch = 
      loan.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      loan.principal.toString().includes(search);
    
    return isArchived && matchesSearch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contratos Arquivados</h1>
          <p className="text-slate-500">
            Visualize todos os contratos que foram pagos e arquivados
          </p>
        </div>
        <Link href="/loans">
          <Button variant="outline">
            <ArchiveIcon className="h-4 w-4 mr-2" />
            Voltar para Contratos
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Empréstimos Arquivados</CardTitle>
          <CardDescription>
            Total de {archivedLoans.length} empréstimos arquivados
          </CardDescription>
          <div className="flex items-center mb-4 mt-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Pesquisar por mutuário ou valor..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Data de Arquivamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum empréstimo arquivado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.borrowerName}</TableCell>
                        <TableCell>{formatCurrency(loan.principal)}</TableCell>
                        <TableCell>{loan.interestRate}%</TableCell>
                        <TableCell>{formatDate(loan.dueDate)}</TableCell>
                        <TableCell>
                          <StatusBadge status={loan.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/loans/${loan.id}`}>
                              <Button variant="outline" size="sm">
                                Detalhes
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
