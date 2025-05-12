import { useEffect, useState } from "react";
import LoanForm from "@/components/loans/LoanForm";
import { useLoan } from "@/context/LoanContext";

export default function NewLoanPage() {
  const { borrowers } = useLoan();
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>("");
  
  useEffect(() => {
    // Verificar se há um parâmetro 'borrower' na URL
    const params = new URLSearchParams(window.location.search);
    const borrowerId = params.get('borrower');
    
    // Se existir um ID de mutuário na URL e ele for válido, selecione-o
    if (borrowerId && borrowers.some(b => b.id === borrowerId)) {
      setSelectedBorrowerId(borrowerId);
    }
  }, [borrowers]);
  
  return <LoanForm preselectedBorrowerId={selectedBorrowerId} />;
}
