import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoanProvider } from "@/context/LoanContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/dashboard";
import LoanList from "@/pages/loans";
import NewLoan from "@/pages/loans/new";
import LoanDetails from "@/pages/loans/[id]";
import EditLoan from "@/pages/loans/[id]/edit";
import BorrowerList from "@/pages/borrowers";
import NewBorrower from "@/pages/borrowers/new";
import BorrowerDetails from "@/pages/borrowers/[id]";
import PaymentList from "@/pages/payments";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
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
      
      <ProtectedRoute path="/loans/:id">
        <Layout>
          <LoanDetails />
        </Layout>
      </ProtectedRoute>
      
      <ProtectedRoute path="/loans/:id/edit">
        <Layout>
          <EditLoan />
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
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LoanProvider>
            <AppRoutes />
          </LoanProvider>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
