import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Agendamento = Tables<'agendamentos'>;

export function useUpcomingAppointments(userId: string | null, daysAhead: number = 7) {
  return useQuery<Agendamento[], Error>({
    queryKey: ["upcomingAppointments", userId, daysAhead],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('get_upcoming_appointments', {
        user_uuid: userId,
        days_ahead: daysAhead,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!userId,
  });
}