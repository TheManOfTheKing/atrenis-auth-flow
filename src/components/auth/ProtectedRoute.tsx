import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type UserRole = "admin" | "personal" | "aluno";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        setIsAuthenticated(true);
        setUserRole(profile.role as UserRole);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUserRole(null);
      } else if (event === "SIGNED_IN" && session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setIsAuthenticated(true);
        setUserRole(profile?.role as UserRole);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
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
