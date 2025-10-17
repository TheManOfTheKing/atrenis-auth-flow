import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AlunoStats = Database['public']['Functions']['get_aluno_stats']['Returns'][0];

export function useAlunoStats() {
  return useQuery<AlunoStats, Error>({
    queryKey: ["alunoStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      const { data, error } = await supabase.rpc('get_aluno_stats', { aluno_uuid: user.id });

      if (error) {
        throw new Error(error.message);
      }
      // A função RPC retorna um array, pegamos o primeiro elemento
      return data[0];
    },
    enabled: true, // Habilita a query
  });
}