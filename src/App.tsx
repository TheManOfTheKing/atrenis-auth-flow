import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AlunoDashboard from "./pages/aluno/AlunoDashboard";
import ExecutarTreino from "./pages/aluno/ExecutarTreino"; // Importar nova página
import HistoricoTreinos from "./pages/aluno/HistoricoTreinos"; // Importar nova página
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPersonalTrainers from "./pages/admin/PersonalTrainers";
import AdminAlunos from "./pages/admin/Alunos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
                <ExecutarTreino /> {/* Nova rota para execução de treino */}
              </AuthLayout>
            </ProtectedRoute>
          } />
          <Route path="/aluno/historico" element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <AuthLayout>
                <HistoricoTreinos /> {/* Nova rota para histórico de treinos */}
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

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;