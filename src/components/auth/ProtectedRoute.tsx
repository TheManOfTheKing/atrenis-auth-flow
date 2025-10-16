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

  const checkAuth = async () => {
    setIsLoading(true);
    setProfileError(null);
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
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileFetchError) throw profileFetchError;

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
        sonnerToast.error("Sua sessão expirou.", {
          description: "Por favor, faça login novamente.",
          duration: 5000,
        });
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
  }, []); // Executar apenas uma vez na montagem

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-8">
        <Loader2 className="h-16 w-16 text-primary-yellow animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Verificando sua autenticação...</p>
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
                navigate("/login");
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