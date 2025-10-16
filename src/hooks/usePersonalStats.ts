import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PersonalStats = Database['public']['Functions']['get_personal_stats']['Returns'][0];

export function usePersonalStats() {
  return useQuery<PersonalStats, Error>({
    queryKey: ["personalStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      const { data, error } = await supabase.rpc('get_personal_stats', { personal_uuid: user.id });

      if (error) {
        throw new Error(error.message);
      }
      // A função RPC retorna um array, pegamos o primeiro elemento
      return data[0];
    },
    // Habilita a query apenas se houver um usuário autenticado
    enabled: !!supabase.auth.getUser(),
  });
}