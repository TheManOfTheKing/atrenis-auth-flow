import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Plan = Tables<'plans'>;
type PlanInsert = TablesInsert<'plans'>;
type PlanUpdate = TablesUpdate<'plans'>;

interface PlansFilter {
  ativo?: boolean | null;
  visivel_landing?: boolean | null; // Novo filtro
  sortBy?: 'nome_asc' | 'nome_desc' | 'preco_mensal_asc' | 'preco_mensal_desc' | 'created_at_asc' | 'created_at_desc' | 'ordem_exibicao_asc'; // Novo sort option
}

export function usePlans(filters?: PlansFilter) {
  const queryClient = useQueryClient();

  return useQuery<Plan[], Error>({
    queryKey: ["plans", filters],
    queryFn: async () => {
      let query = supabase.from('plans').select('*');

      if (filters?.ativo !== undefined && filters.ativo !== null) {
        query = query.eq('ativo', filters.ativo);
      }
      if (filters?.visivel_landing !== undefined && filters.visivel_landing !== null) {
        query = query.eq('visivel_landing', filters.visivel_landing);
      }

      switch (filters?.sortBy) {
        case 'nome_asc':
          query = query.order('nome', { ascending: true });
          break;
        case 'nome_desc':
          query = query.order('nome', { ascending: false });
          break;
        case 'preco_mensal_asc':
          query = query.order('preco_mensal', { ascending: true });
          break;
        case 'preco_mensal_desc':
          query = query.order('preco_mensal', { ascending: false });
          break;
        case 'created_at_asc':
          query = query.order('created_at', { ascending: true });
          break;
        case 'created_at_desc':
          query = query.order('created_at', { ascending: false });
          break;
        case 'ordem_exibicao_asc': // Novo sort option
          query = query.order('ordem_exibicao', { ascending: true });
          break;
        default:
          query = query.order('nome', { ascending: true });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation<Plan, Error, PlanInsert>({
    mutationFn: async (newPlan) => {
      const { data, error } = await supabase
        .from('plans')
        .insert(newPlan)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Sucesso!", description: "Plano criado com sucesso." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao criar plano", description: error.message });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation<Plan, Error, PlanUpdate>({
    mutationFn: async (updatedPlan) => {
      if (!updatedPlan.id) throw new Error("ID do plano é obrigatório para atualização.");
      const { data, error } = await supabase
        .from('plans')
        .update(updatedPlan)
        .eq('id', updatedPlan.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Sucesso!", description: "Plano atualizado com sucesso." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar plano", description: error.message });
    },
  });
}

export function useTogglePlanStatus() {
  const queryClient = useQueryClient();
  return useMutation<Plan, Error, { id: string; ativo: boolean }>({
    mutationFn: async ({ id, ativo }) => {
      const { data, error } = await supabase
        .from('plans')
        .update({ ativo: ativo })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Sucesso!", description: `Plano ${data.ativo ? 'ativado' : 'desativado'} com sucesso.` });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao alterar status do plano", description: error.message });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Sucesso!", description: "Plano excluído com sucesso." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao excluir plano", description: error.message });
    },
  });
}