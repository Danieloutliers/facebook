import { useParams } from "wouter";
import LoanDetails from "@/components/loans/LoanDetails";

export default function LoanDetailsPage() {
  const { id } = useParams();
  
  if (!id) {
    return <div>ID do empréstimo não fornecido</div>;
  }
  
  return <LoanDetails loanId={id} />;
}
