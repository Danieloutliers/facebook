import { useState } from "react";
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
import { LoanType } from "@/types";

interface ArchiveLoanDialogProps {
  loan: LoanType;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (loanId: string) => void;
}

export function ArchiveLoanDialog({
  loan,
  isOpen,
  onClose,
  onConfirm,
}: ArchiveLoanDialogProps) {
  // Usar estado local para garantir que o diálogo feche após confirmação
  const [open, setOpen] = useState(isOpen);

  // Lidar com mudanças no isOpen prop
  if (isOpen !== open) {
    setOpen(isOpen);
  }

  const handleConfirm = () => {
    onConfirm(loan.id);
    setOpen(false);
    onClose();
  };

  const handleCancel = () => {
    setOpen(false);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar Empréstimo</AlertDialogTitle>
          <AlertDialogDescription>
            O empréstimo para <strong>{loan.borrowerName}</strong> foi totalmente pago.
            Deseja arquivá-lo para mantê-lo organizado? 
            <br /><br />
            Empréstimos arquivados não aparecem na lista principal, mas continuam 
            disponíveis para consulta no histórico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Não, manter visível
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Sim, arquivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
