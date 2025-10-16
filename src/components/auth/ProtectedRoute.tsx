import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast as sonnerToast } from "sonner"; // Usar sonner para notificações não-bloqueantes
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, LogOut } from "lucide-react"; // Ícones para loading e erro

type UserRole = "admin" | "personal" | "aluno";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isAccountDeactivated, setIsAccountDeactivated] = useState(false);

  const checkAuth = async () => {
    setIsLoading(true);
    setProfileError(null);
    setIsAccountDeactivated(false);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (!session) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("role, ativo") // Buscar também o status 'ativo'
        .eq("id", session.user.id)
        .single();

      if (profileFetchError) throw profileFetchError;

      // Verificar se a conta está ativa
      if (profile.ativo === false) {
        setIsAccountDeactivated(true);
        setIsAuthenticated(false); // Não autenticar se a conta estiver desativada
        await supabase.auth.signOut(); // Forçar logout para limpar a sessão
        return;
      }

      setIsAuthenticated(true);
      setUserRole(profile.role as UserRole);
    } catch (error: any) {
      console.error("Error checking auth or fetching profile:", error);
      setIsAuthenticated(false);
      setProfileError(error.message || "Não foi possível carregar seu perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUserRole(null);
        // Se o logout não foi por desativação, mostrar toast genérico
        if (!isAccountDeactivated) {
          sonnerToast.error("Sua sessão expirou.", {
            description: "Por favor, faça login novamente.",
            duration: 5000,
          });
        }
        // Limpar localStorage e sessionStorage para garantir que não há dados de sessão antigos
        localStorage.clear();
        sessionStorage.clear();
        // Redirecionar para login com um parâmetro para exibir a mensagem
        window.location.href = "/login?expired=true";
      } else if (event === "SIGNED_IN" && session) {
        // Se o usuário acabou de fazer login, re-verificar o perfil
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [isAccountDeactivated]); // Adicionar isAccountDeactivated como dependência

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-8">
        <Loader2 className="h-16 w-16 text-primary-yellow animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Verificando sua autenticação...</p>
      </div>
    );
  }

  if (isAccountDeactivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Conta Desativada</AlertTitle>
          <AlertDescription>
            Sua conta foi desativada. Por favor, entre em contato com seu personal trainer para mais informações.
            <div className="flex gap-2 mt-4">
              <Button onClick={() => window.location.href = "/login"} variant="outline">
                Ir para o Login
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Erro de Autenticação</AlertTitle>
          <AlertDescription>
            {profileError}
            <div className="flex gap-2 mt-4">
              <Button onClick={checkAuth} variant="outline">Tentar Novamente</Button>
              <Button onClick={() => {
                supabase.auth.signOut();
                window.location.href = "/login"; // Usar window.location.href para garantir o refresh
              }} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" /> Fazer Logout
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    // Redirecionar para dashboard correto
    if (userRole === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (userRole === "personal") return <Navigate to="/personal/dashboard" replace />;
    if (userRole === "aluno") return <Navigate to="/aluno/dashboard" replace />;
  }

  return <>{children}</>;
}