import LoanForm from "@/components/loans/LoanForm";
import { useLoan } from "@/context/LoanContext";

export default function NewLoanPage() {
  // Esta linha não faz nada diretamente, mas força a verificação de que o componente está dentro do LoanProvider
  // Se o LoanProvider não estiver disponível, um erro será lançado aqui antes de tentar renderizar o LoanForm
  useLoan();
  
  return <LoanForm />;
}
