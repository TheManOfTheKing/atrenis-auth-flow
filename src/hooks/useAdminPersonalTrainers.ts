import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database, Enums } from "@/integrations/supabase/types";

// Tipo para o retorno da função RPC get_personal_trainers_admin_view
export type PersonalTrainerAdminView = Database['public']['Functions']['get_personal_trainers_admin_view']['Returns'][0];

const ITEMS_PER_PAGE = 10;

interface UseAdminPersonalTrainersFilters {
  searchTerm: string;
  planFilter: string | null; // plan_id
  statusFilter: Enums<'subscription_status'> | null;
  sortBy: string; // 'nome_asc', 'created_at_desc', etc.
  currentPage: number;
}

export function useAdminPersonalTrainers(filters: UseAdminPersonalTrainersFilters) {
  const queryClient = useQueryClient();
  const { searchTerm, planFilter, statusFilter, sortBy, currentPage } = filters;

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data, isLoading, error } = useQuery<{ personalTrainers: PersonalTrainerAdminView[], count: number }>({
    queryKey: ["adminPersonalTrainers", debouncedSearchTerm, planFilter, statusFilter, sortBy, currentPage],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_personal_trainers_admin_view', {
        search_term: debouncedSearchTerm || null,
        plan_filter: planFilter || null,
        status_filter: statusFilter || null,
        sort_by: sortBy,
        page_size: ITEMS_PER_PAGE,
        page_number: currentPage
      });

      if (error) {
        console.error("Erro ao chamar RPC get_personal_trainers_admin_view:", error);
        throw error;
      }

      const personalTrainers = data || [];
      const count = personalTrainers.length > 0 ? Number(personalTrainers[0].total_count) : 0;

      return { personalTrainers, count };
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    cacheTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const totalPersonalTrainers = data?.count || 0;
  const totalPages = Math.ceil(totalPersonalTrainers / ITEMS_PER_PAGE);

  // Prefetch da próxima página
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: ["adminPersonalTrainers", debouncedSearchTerm, planFilter, statusFilter, sortBy, nextPage],
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_personal_trainers_admin_view', {
            search_term: debouncedSearchTerm || null,
            plan_filter: planFilter || null,
            status_filter: statusFilter || null,
            sort_by: sortBy,
            page_size: ITEMS_PER_PAGE,
            page_number: nextPage
          });

          if (error) {
            console.error("Erro ao chamar RPC get_personal_trainers_admin_view para prefetch:", error);
            throw error;
          }
          const personalTrainers = data || [];
          const count = personalTrainers.length > 0 ? Number(personalTrainers[0].total_count) : 0;
          return { personalTrainers, count };
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      });
    }
  }, [currentPage, totalPages, debouncedSearchTerm, planFilter, statusFilter, sortBy, queryClient]);

  return {
    personalTrainers: data?.personalTrainers || [],
    totalPersonalTrainers,
    totalPages,
    isLoading,
    error,
  };
}