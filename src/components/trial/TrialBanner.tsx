import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Crown, X } from "lucide-react";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useState } from "react";
import { useLocation } from "wouter";

export function TrialBanner() {
  const { plan, daysRemaining, expiresAt, loading } = useTrialStatus();
  const [dismissed, setDismissed] = useState(false);
  const [, navigate] = useLocation();

  // Não mostrar se não for plano trial/GRATIS, se estiver carregando ou se foi dismissado
  if (loading || (plan !== 'trial' && plan !== 'GRATIS') || dismissed || !daysRemaining) {
    return null;
  }

  // Definir cor do banner baseado nos dias restantes
  const getVariant = () => {
    if (daysRemaining <= 3) return "destructive";
    if (daysRemaining <= 7) return "default";
    return "default";
  };

  const getIcon = () => {
    if (daysRemaining <= 3) return <Clock className="h-4 w-4" />;
    return <Crown className="h-4 w-4" />;
  };

  const getMessage = () => {
    if (plan === 'GRATIS') {
      if (daysRemaining <= 1) {
        return "Seu plano gratuito expira hoje! Assine um plano para continuar usando o LoanBuddy.";
      }
      if (daysRemaining <= 3) {
        return `Seu plano gratuito expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}. Assine um plano para continuar.`;
      }
      if (daysRemaining <= 7) {
        return `Restam ${daysRemaining} dias do seu plano gratuito. Considere fazer upgrade.`;
      }
      return `Você tem ${daysRemaining} dias restantes no seu plano gratuito.`;
    } else {
      if (daysRemaining <= 1) {
        return "Seu teste expira hoje! Assine um plano para continuar usando o LoanBuddy.";
      }
      if (daysRemaining <= 3) {
        return `Seu teste expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}. Assine um plano para continuar.`;
      }
      if (daysRemaining <= 7) {
        return `Restam ${daysRemaining} dias do seu teste gratuito. Considere assinar um plano.`;
      }
      return `Você tem ${daysRemaining} dias restantes no seu teste gratuito.`;
    }
  };

  return (
    <div className="border-b border-border bg-muted/30">
      <Alert variant={getVariant()} className="rounded-none border-0 bg-transparent">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {plan === 'GRATIS' ? 'Plano Gratuito' : 'Teste Gratuito'}
              </Badge>
              <AlertDescription className="text-sm">
                {getMessage()}
              </AlertDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/trial-expired')}>
              Ver Planos
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}