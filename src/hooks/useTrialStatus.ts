import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Chave para simular expiração do teste no localStorage
const TRIAL_SIMULATION_KEY = 'loanbuddy_simulate_trial_expired';

interface TrialStatus {
  isExpired: boolean;
  expiresAt: Date | null;
  plan: 'GRATIS' | 'trial' | 'premium' | 'enterprise';
  daysRemaining: number | null;
  loading: boolean;
  simulateExpired: () => void;
  resetSimulation: () => void;
}

export function useTrialStatus(): TrialStatus {
  const { user } = useAuth();
  const [statusData, setStatusData] = useState({
    isExpired: false,
    expiresAt: null as Date | null,
    plan: 'GRATIS' as 'GRATIS' | 'trial' | 'premium' | 'enterprise',
    daysRemaining: null as number | null,
    loading: true
  });

  const simulateExpired = () => {
    localStorage.setItem(TRIAL_SIMULATION_KEY, 'true');
    setStatusData({
      isExpired: true,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expirou ontem
      plan: 'GRATIS',
      daysRemaining: 0,
      loading: false
    });
  };

  const resetSimulation = () => {
    localStorage.removeItem(TRIAL_SIMULATION_KEY);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas restantes
    const hoursRemaining = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60));
    const daysRemaining = Math.max(0, Math.ceil(hoursRemaining / 24));
    
    setStatusData({
      isExpired: false,
      expiresAt,
      plan: 'trial',
      daysRemaining,
      loading: false
    });
  };

  useEffect(() => {
    async function checkTrialStatus() {
      // Verificar se estamos simulando teste expirado
      const isSimulatingExpired = localStorage.getItem(TRIAL_SIMULATION_KEY) === 'true';
      
      if (!user || !isSupabaseConfigured()) {
        // Em modo de desenvolvimento, verificar simulação
        if (isSimulatingExpired) {
          setStatusData({
            isExpired: true,
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expirou ontem
            plan: 'trial',
            daysRemaining: 0,
            loading: false
          });
          return;
        }
        
        // Simular um usuário com teste ativo
        const mockExpiresAt = new Date();
        mockExpiresAt.setDate(mockExpiresAt.getDate() + 3); // 3 dias de teste restantes
        
        const daysRemaining = Math.max(0, Math.ceil((mockExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        
        setStatusData({
          isExpired: false,
          expiresAt: mockExpiresAt,
          plan: 'GRATIS',
          daysRemaining,
          loading: false
        });
        return;
      }

      try {
        // Buscar perfil do usuário no Supabase
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('expires_at, plan')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          
          // Se não encontrou o perfil, criar um novo com teste de 3 dias
          if (error.code === 'PGRST116') { // Row not found
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 3); // 3 dias de teste

            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email || '',
                expires_at: expiresAt.toISOString(),
                plan: 'GRATIS'
              });

            if (insertError) {
              console.error('Erro ao criar perfil:', insertError);
            }

            const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

            setStatusData({
              isExpired: false,
              expiresAt,
              plan: 'GRATIS',
              daysRemaining,
              loading: false
            });
            return;
          }

          setStatusData(prev => ({ ...prev, loading: false }));
          return;
        }

        const now = new Date();
        const expiresAt = profile.expires_at ? new Date(profile.expires_at) : null;
        const isExpired = expiresAt ? now > expiresAt : false;
        const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;

        setStatusData({
          isExpired,
          expiresAt,
          plan: profile.plan || 'GRATIS',
          daysRemaining,
          loading: false
        });

      } catch (error) {
        console.error('Erro ao verificar status do teste:', error);
        setStatusData(prev => ({ ...prev, loading: false }));
      }
    }

    checkTrialStatus();
  }, [user]);

  return {
    ...statusData,
    simulateExpired,
    resetSimulation
  };
}