import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"; // Importar DevTools
import { persistQueryClient } from '@tanstack/react-query-persist-client'; // Importar para persistência
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'; // Importar para persistência
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes"; // Importar ThemeProvider

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import RecuperarSenha from "./pages/auth/RecuperarSenha";
import RedefinirSenha from "./pages/auth/RedefinirSenha";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthLayout from "./components/layout/AuthLayout";
import PersonalDashboard from "./pages/personal/PersonalDashboard";
import Alunos from "./pages/personal/Alunos";
import NovoAluno from "./pages/personal/NovoAluno";
import Exercicios from "./pages/personal/Exercicios";
import NovoExercicio from "./pages/personal/NovoExercicio";
import Treinos from "./pages/personal/Treinos";
import NovoTreino from "./pages/personal/NovoTreino";
import AlunoHistorico from "./pages/personal/AlunoHistorico";
import AlunoDashboard from "./pages/aluno/AlunoDashboard";
import ExecutarTreino from "./pages/aluno/ExecutarTreino";
import HistoricoTreinos from "./pages/aluno/HistoricoTreinos";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPersonalTrainers from "./pages/admin/PersonalTrainers";
import AdminAlunos from "./pages/admin/Alunos";
import AdminPlans from "./pages/admin/Plans"; // Importar a nova página de planos

// Configuração do Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Refetch ao focar na janela
      refetchOnWindowFocus: true,
      // Retry 3 vezes em caso de erro
      retry: 3,
      // Intervalo de retry exponencial
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry uma vez para mutations
      retry: 1,
    },
  },
});

// Configuração da persistência do cache
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

// Persistir o cache do query client
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 horas de persistência
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            
            {/* Personal Routes */}
            <Route path="/personal/dashboard" element={
              <ProtectedRoute allowedRoles={['personal']}>
                <AuthLayout>
                  <PersonalDashboard />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/personal/alunos" element={
              <ProtectedRoute allowedRoles={['personal']}>
                <AuthLayout>
                  <Alunos />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/personal/alunos/new" element={
              <ProtectedRoute allowedRoles={['personal']}>
                <AuthLayout>
                  <NovoAluno />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/personal/alunos/:alunoId/historico" element={
              <ProtectedRoute allowedRoles={['personal']}>
                <AuthLayout>
                  <AlunoHistorico />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/personal/exercicios" element={
              <ProtectedRoute allowedRoles={['personal']}>
                <AuthLayout>
                  <Exercicios />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/personal/exercicios/new" element={
              <ProtectedRoute allowedRoles={['personal']}>
                <AuthLayout>
                  <NovoExercicio />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/personal/treinos" element={
              <ProtectedRoute allowedRoles={['personal']}>
                <AuthLayout>
                  <Treinos />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/personal/treinos/new" element={
              <ProtectedRoute allowedRoles={['personal']}>
                <AuthLayout>
                  <NovoTreino />
                </AuthLayout>
              </ProtectedRoute>
            } />

            {/* Aluno Routes */}
            <Route path="/aluno/dashboard" element={
              <ProtectedRoute allowedRoles={['aluno']}>
                <AuthLayout>
                  <AlunoDashboard />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/aluno/treino/:alunoTreinoId" element={
              <ProtectedRoute allowedRoles={['aluno']}>
                <AuthLayout>
                  <ExecutarTreino />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/aluno/historico" element={
              <ProtectedRoute allowedRoles={['aluno']}>
                <AuthLayout>
                  <HistoricoTreinos />
                </AuthLayout>
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuthLayout>
                  <AdminDashboard />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/personal-trainers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuthLayout>
                  <AdminPersonalTrainers />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/alunos" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuthLayout>
                  <AdminAlunos />
                </AuthLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/planos" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuthLayout>
                  <AdminPlans />
                </AuthLayout>
              </ProtectedRoute>
            } />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      {/* React Query DevTools - apenas em desenvolvimento */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;