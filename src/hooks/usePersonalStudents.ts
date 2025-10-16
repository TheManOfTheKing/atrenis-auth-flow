import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type AlunoWithTreinosCount = Tables<'profiles'> & {
  aluno_treinos: { count: number }[];
  treinos_count?: number; // Adicionado para a RPC
  total_count?: number; // Adicionado para a RPC
};

const ITEMS_PER_PAGE = 10;

export function usePersonalStudents(personalId: string | null) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("nome_asc"); // 'nome_asc', 'nome_desc', 'recentes', 'antigos'
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data, isLoading, error } = useQuery<{ alunos: AlunoWithTreinosCount[], count: number }>({
    queryKey: ["personalStudents", personalId, debouncedSearchTerm, sortOrder, currentPage],
    queryFn: async () => {
      if (!personalId) return { alunos: [], count: 0 };

      const { data, error } = await supabase.rpc('get_alunos_with_treinos', {
        personal_id_param: personalId,
        search_term: debouncedSearchTerm || null,
        sort_order: sortOrder,
        page_size: ITEMS_PER_PAGE,
        page_number: currentPage
      });

      if (error) {
        console.error("Erro ao chamar RPC get_alunos_with_treinos:", error);
        throw error;
      }

      const alunos = data || [];
      const count = alunos.length > 0 ? Number(alunos[0].total_count) : 0;

      return {
        alunos: alunos.map(a => ({
          ...a,
          aluno_treinos: [{ count: a.treinos_count || 0 }]
        })),
        count
      };
    },
    enabled: !!personalId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const totalAlunos = data?.count || 0;
  const totalPages = Math.ceil(totalAlunos / ITEMS_PER_PAGE);

  // Prefetch da próxima página
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: ["personalStudents", personalId, debouncedSearchTerm, sortOrder, nextPage],
        queryFn: async () => {
          if (!personalId) return { alunos: [], count: 0 };
          
          const { data, error } = await supabase.rpc('get_alunos_with_treinos', {
            personal_id_param: personalId,
            search_term: debouncedSearchTerm || null,
            sort_order: sortOrder,
            page_size: ITEMS_PER_PAGE,
            page_number: nextPage
          });

          if (error) {
            console.error("Erro ao chamar RPC get_alunos_with_treinos para prefetch:", error);
            throw error;
          }

          const alunos = data || [];
          const count = alunos.length > 0 ? Number(alunos[0].total_count) : 0;

          return {
            alunos: alunos.map(a => ({
              ...a,
              aluno_treinos: [{ count: a.treinos_count || 0 }]
            })),
            count
          };
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      });
    }
  }, [currentPage, totalPages, personalId, debouncedSearchTerm, sortOrder, queryClient]);

  // Log de debug para monitorar o estado da query
  useEffect(() => {
    console.log("Estado da query de alunos:", {
      isLoading,
      hasError: !!error,
      errorMessage: error?.message,
      hasData: !!data,
      alunosCount: data?.alunos?.length || 0,
      totalCount: data?.count || 0,
      personalId,
      searchTerm: debouncedSearchTerm,
      sortOrder,
      currentPage
    });
  }, [isLoading, error, data, personalId, debouncedSearchTerm, sortOrder, currentPage]);


  return {
    alunos: data?.alunos || [],
    totalAlunos,
    totalPages,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
  };
}