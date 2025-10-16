import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Plan = Tables<'plans'>;
type PlanInsert = TablesInsert<'plans'>;
type PlanUpdate = TablesUpdate<'plans'>;

interface PlansFilter {
  ativo?: boolean | null;
  visivel_landing?: boolean | null;
  tipo?: Enums<'plan_type'> | null; // Novo filtro por tipo
  sortBy?: 'nome_asc' | 'nome_desc' | 'preco_mensal_asc' | 'preco_mensal_desc' | 'created_at_asc' | 'created_at_desc' | 'ordem_exibicao_asc';
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
      if (filters?.tipo !== undefined && filters.tipo !== null) {
        query = query.eq('tipo', filters.tipo);
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
        case 'ordem_exibicao_asc':
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

      // Check if plan type is being changed and if it's in use
      if (updatedPlan.tipo) {
        const { data: currentPlan, error: fetchError } = await supabase
          .from('plans')
          .select('tipo')
          .eq('id', updatedPlan.id)
          .single();

        if (fetchError) throw fetchError;

        if (currentPlan?.tipo !== updatedPlan.tipo) {
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('plan_id', updatedPlan.id);

          if (countError) throw countError;

          if (count && count > 0) {
            throw new Error("Não é possível alterar o tipo de um plano que já está atribuído a personal trainers.");
          }
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ["adminPersonalTrainers"] }); // Invalidate personals to reflect plan changes
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
      if (!ativo) { // If deactivating, check for active subscriptions
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('plan_id', id)
          .eq('status_assinatura', 'ativa');

        if (countError) throw countError;

        if (count && count > 0) {
          throw new Error(`Não é possível desativar este plano. Há ${count} personal trainer(s) com assinatura ativa.`);
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ["adminPersonalTrainers"] }); // Invalidate personals to reflect plan changes
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
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        throw new Error(`Não é possível excluir este plano. Há ${count} personal trainer(s) associado(s) a ele.`);
      }

      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["adminPersonalTrainers"] }); // Invalidate personals to reflect plan changes
      toast({ title: "Sucesso!", description: "Plano excluído com sucesso." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao excluir plano", description: error.message });
    },
  });
}

export function useDuplicatePlan() {
  const queryClient = useQueryClient();
  return useMutation<Plan, Error, string>({
    mutationFn: async (planId) => {
      const { data: originalPlan, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalPlan) throw new Error("Plano original não encontrado.");

      const { data, error } = await supabase
        .from('plans')
        .insert({
          nome: `${originalPlan.nome} (Cópia)`,
          descricao: originalPlan.descricao,
          preco_mensal: originalPlan.preco_mensal,
          preco_anual: originalPlan.preco_anual,
          max_alunos: originalPlan.max_alunos,
          recursos: originalPlan.recursos,
          ativo: false, // Cópia é inativa por padrão
          tipo: originalPlan.tipo,
          visivel_landing: false, // Cópia não é visível na landing por padrão
          ordem_exibicao: 0, // Ordem padrão
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Sucesso!", description: "Plano duplicado com sucesso. A cópia está inativa por padrão." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao duplicar plano", description: error.message });
    },
  });
}

export function useUpdatePlanOrder() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; newOrder: number }>({
    mutationFn: async ({ id, newOrder }) => {
      const { error } = await supabase
        .from('plans')
        .update({ ordem_exibicao: newOrder })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Sucesso!", description: "Ordem de exibição atualizada." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao atualizar ordem", description: error.message });
    },
  });
}

export function usePersonalsWithPlan(planId: string | null) {
  return useQuery<Tables<'profiles'>[], Error>({
    queryKey: ["personalsWithPlan", planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('plan_id', planId)
        .eq('role', 'personal'); // Ensure only personal trainers
      if (error) throw error;
      return data;
    },
    enabled: !!planId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCountPersonalsWithPlan(planId: string | null) {
  return useQuery<number, Error>({
    queryKey: ["countPersonalsWithPlan", planId],
    queryFn: async () => {
      if (!planId) return 0;
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', planId)
        .eq('role', 'personal');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!planId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}