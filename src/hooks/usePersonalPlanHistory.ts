import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type PlanHistoryEntry = Tables<'plan_history'>;

export function usePersonalPlanHistory(personalId: string | null) {
  return useQuery<PlanHistoryEntry[], Error>({
    queryKey: ["personalPlanHistory", personalId],
    queryFn: async () => {
      if (!personalId) return [];
      const { data, error } = await supabase.rpc('get_personal_plan_history', { p_personal_id: personalId });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!personalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}