import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoanProvider } from "@/context/LoanContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LockProvider, useLock } from "@/context/LockContext";
import { LockScreen } from "@/components/lock/LockScreen";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/dashboard";
import LoanList from "@/pages/loans";
import NewLoan from "@/pages/loans/new";
import LoanDetails from "@/pages/loans/[id]";
import EditLoan from "@/pages/loans/[id]/edit";
import ArchivedLoans from "@/pages/loans/archived";
import BorrowerList from "@/pages/borrowers";
import NewBorrower from "@/pages/borrowers/new";
import BorrowerDetails from "@/pages/borrowers/[id]";
import PaymentList from "@/pages/payments";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import HowToUse from "@/pages/how-to-use";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import HTMLPage from "@/pages/html-link";
import TrialExpired from "@/pages/trial-expired";
import TestLanding from "@/pages/test-landing";



// Importe o componente de callback
import AuthCallback from "@/pages/auth/callback";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/landing" component={LandingPage} />
      <Route path="/teste" component={TestLanding} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/trial-expired" component={TrialExpired} />
      
      <ProtectedRoute path="/">
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/loans">
        <Layout>
          <LoanList />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/loans/new">
        <Layout>
          <NewLoan />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/loans/archived">
        <Layout>
          <ArchivedLoans />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/loans/:id/edit">
        <Layout>
          <EditLoan />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/loans/:id">
        <Layout>
          <LoanDetails />
        </Layout>
      </ProtectedRoute>
      

      <ProtectedRoute path="/borrowers">
        <Layout>
          <BorrowerList />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/borrowers/new">
        <Layout>
          <NewBorrower />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/borrowers/:id">
        <Layout>
          <BorrowerDetails />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/payments">
        <Layout>
          <PaymentList />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/reports">
        <Layout>
          <Reports />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/settings">
        <Layout>
          <Settings />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/how-to-use">
        <Layout>
          <HowToUse />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/html-version">
        <Layout>
          <HTMLPage />
        </Layout>
      </ProtectedRoute>
      
      <Route component={NotFound} />
    </Switch>
  );
}

// Componente auxiliar para gerenciar a tela de bloqueio
function AppContent() {
  const { isLocked } = useLock();
  
  return (
    <>
      <AppRoutes />
      <Toaster />
      {isLocked && <LockScreen />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <LoanProvider>
              <LockProvider>
                <AppContent />
              </LockProvider>
            </LoanProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
