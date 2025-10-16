import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AdminSummaryStats = Database['public']['Functions']['get_admin_summary_stats']['Returns'][0];
type PersonalsGrowthMonthly = Database['public']['Functions']['get_personals_growth_monthly']['Returns'][0];
type StudentsPerPersonalTop10 = Database['public']['Functions']['get_students_per_personal_top10']['Returns'][0];
type PlansDistributionStats = Database['public']['Functions']['get_plans_distribution_stats']['Returns'][0];
type RecentSubscriptions = Database['public']['Functions']['get_recent_subscriptions']['Returns'][0];
type ExpiringSubscriptions = Database['public']['Functions']['get_expiring_subscriptions']['Returns'][0];
type PersonalsWithoutActivePlan = Database['public']['Functions']['get_personals_without_active_plan']['Returns'][0];

const REFETCH_INTERVAL = 30 * 1000; // 30 segundos

export function useAdminSummaryStats() {
  return useQuery<AdminSummaryStats, Error>({
    queryKey: ["adminSummaryStats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_summary_stats');
      if (error) throw new Error(error.message);
      return data[0];
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function usePersonalsGrowthMonthly() {
  return useQuery<PersonalsGrowthMonthly[], Error>({
    queryKey: ["personalsGrowthMonthly"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_personals_growth_monthly');
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useStudentsPerPersonalTop10() {
  return useQuery<StudentsPerPersonalTop10[], Error>({
    queryKey: ["studentsPerPersonalTop10"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_students_per_personal_top10');
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function usePlansDistributionStats() {
  return useQuery<PlansDistributionStats[], Error>({
    queryKey: ["plansDistributionStats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_plans_distribution_stats');
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useRecentSubscriptions() {
  return useQuery<RecentSubscriptions[], Error>({
    queryKey: ["recentSubscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_subscriptions');
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useExpiringSubscriptions(daysAhead: number = 7) {
  return useQuery<ExpiringSubscriptions[], Error>({
    queryKey: ["expiringSubscriptions", daysAhead],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_expiring_subscriptions', { days_ahead: daysAhead });
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function usePersonalsWithoutActivePlan() {
  return useQuery<PersonalsWithoutActivePlan[], Error>({
    queryKey: ["personalsWithoutActivePlan"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_personals_without_active_plan');
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: REFETCH_INTERVAL,
  });
}