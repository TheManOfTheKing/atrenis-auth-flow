import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton"; // Usar Skeleton para o estado de carregamento

type UserRole = Database['public']['Enums']['user_role'];

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode; // Opcional: o que mostrar se não tiver permissão
}

export default function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { data: userRole, isLoading, error } = useQuery<UserRole | null, Error>({
    queryKey: ["userRole"], // A role do usuário logado é global, então uma chave simples é suficiente
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null; // Não há usuário logado
      }

      // Usar a função RPC get_my_role para buscar a role de forma eficiente
      const { data: role, error: rpcError } = await supabase.rpc('get_my_role');
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      return role as UserRole;
    },
    staleTime: 5 * 60 * 1000, // Cache a role por 5 minutos
    cacheTime: 10 * 60 * 1000, // Manter no cache por 10 minutos
  });

  if (isLoading) {
    // Mostrar um skeleton ou null enquanto a role está sendo carregada
    return <Skeleton className="h-10 w-full" />; // Exemplo de skeleton
  }

  if (error) {
    console.error("Erro ao carregar role do usuário:", error);
    return fallback; // Em caso de erro, mostra o fallback ou null
  }

  if (userRole && allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  return fallback;
}