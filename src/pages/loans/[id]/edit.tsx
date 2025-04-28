import { useParams } from "wouter";
import LoanForm from "@/components/loans/LoanForm";
import { useLoan } from "@/context/LoanContext";

export default function EditLoanPage() {
  const { id } = useParams();
  const { getLoanById } = useLoan();
  
  if (!id) {
    return <div>ID do empréstimo não fornecido</div>;
  }
  
  const loan = getLoanById(id);
  
  if (!loan) {
    return <div>Empréstimo não encontrado</div>;
  }
  
  return <LoanForm loan={loan} isEditing={true} />;
}
