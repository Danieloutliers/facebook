import { useState } from "react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import { useLoan } from "@/context/LoanContext";

export default function BorrowerList() {
  const { borrowers, getLoansByBorrowerId } = useLoan();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter borrowers based on search term
  const filteredBorrowers = borrowers.filter((borrower) =>
    borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (borrower.email && borrower.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (borrower.phone && borrower.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get active loan count for a borrower
  const getActiveLoanCount = (borrowerId: string) => {
    const borrowerLoans = getLoansByBorrowerId(borrowerId);
    return borrowerLoans.filter(loan => loan.status === 'active').length;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <CardTitle className="text-xl font-semibold">Mutuários</CardTitle>
        <Link href="/borrowers/new">
          <Button className="sm:ml-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Mutuário
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Buscar por nome, email ou telefone..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Empréstimos Ativos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBorrowers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum mutuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBorrowers.map((borrower) => (
                    <TableRow key={borrower.id}>
                      <TableCell className="font-medium">{borrower.name}</TableCell>
                      <TableCell>{borrower.email || '-'}</TableCell>
                      <TableCell>{borrower.phone || '-'}</TableCell>
                      <TableCell>{getActiveLoanCount(borrower.id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/borrowers/${borrower.id}`}>
                            <Button variant="outline" size="sm">
                              Detalhes
                            </Button>
                          </Link>
                          <Link href={`/borrowers/${borrower.id}?edit=true`}>
                            <Button variant="outline" size="sm">
                              Editar
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
  );
}
