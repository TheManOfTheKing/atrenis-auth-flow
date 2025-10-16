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
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null); // true = ativos, false = inativos, null = todos
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
    queryKey: ["personalStudents", personalId, debouncedSearchTerm, sortOrder, statusFilter, currentPage],
    queryFn: async () => {
      if (!personalId) return { alunos: [], count: 0 };

      let query = supabase
        .from("profiles")
        .select(`
          *,
          aluno_treinos(count)
        `, { count: 'exact' })
        .eq("personal_id", personalId)
        .eq("role", "aluno");

      if (debouncedSearchTerm) {
        query = query.or(`nome.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`);
      }

      if (statusFilter !== null) {
        query = query.eq("ativo", statusFilter);
      }

      switch (sortOrder) {
        case "nome_asc":
          query = query.order("nome", { ascending: true });
          break;
        case "nome_desc":
          query = query.order("nome", { ascending: false });
          break;
        case "recentes":
          query = query.order("created_at", { ascending: false });
          break;
        case "antigos":
          query = query.order("created_at", { ascending: true });
          break;
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: alunosData, count, error } = await query;
      if (error) throw error;

      return { alunos: alunosData as AlunoWithTreinosCount[], count: count || 0 };
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
        queryKey: ["personalStudents", personalId, debouncedSearchTerm, sortOrder, statusFilter, nextPage],
        queryFn: async () => {
          if (!personalId) return { alunos: [], count: 0 };
          
          let query = supabase
            .from("profiles")
            .select(`
              *,
              aluno_treinos(count)
            `, { count: 'exact' })
            .eq("personal_id", personalId)
            .eq("role", "aluno");

          if (debouncedSearchTerm) {
            query = query.or(`nome.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`);
          }

          if (statusFilter !== null) {
            query = query.eq("ativo", statusFilter);
          }

          switch (sortOrder) {
            case "nome_asc":
              query = query.order("nome", { ascending: true });
              break;
            case "nome_desc":
              query = query.order("nome", { ascending: false });
              break;
            case "recentes":
              query = query.order("created_at", { ascending: false });
              break;
            case "antigos":
              query = query.order("created_at", { ascending: true });
              break;
          }

          const from = (nextPage - 1) * ITEMS_PER_PAGE;
          const to = from + ITEMS_PER_PAGE - 1;
          query = query.range(from, to);

          const { data: alunosData, count, error } = await query;
          if (error) throw error;

          return { alunos: alunosData as AlunoWithTreinosCount[], count: count || 0 };
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      });
    }
  }, [currentPage, totalPages, personalId, debouncedSearchTerm, sortOrder, statusFilter, queryClient]);

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
      statusFilter,
      currentPage
    });
  }, [isLoading, error, data, personalId, debouncedSearchTerm, sortOrder, statusFilter, currentPage]);


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
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
  };
}