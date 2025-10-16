import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Enums } from "@/integrations/supabase/types";

interface AssignPlanParams {
  personalId: string;
  planId: string;
  desconto_percentual: number;
  periodo: 'mensal' | 'anual' | 'vitalicio';
  data_inicio: string;
}

interface AssignPlanResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function useAssignPlan() {
  const queryClient = useQueryClient();

  return useMutation<AssignPlanResponse, Error, AssignPlanParams>({
    mutationFn: async (params: AssignPlanParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase.rpc('assign_plan_to_personal', {
        p_personal_id: params.personalId,
        p_plan_id: params.planId,
        p_desconto_percentual: params.desconto_percentual,
        p_periodo: params.periodo,
        p_data_inicio: params.data_inicio,
        p_admin_id: user.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: AssignPlanResponse = data as AssignPlanResponse;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao atribuir plano.");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPersonalTrainers"] });
      queryClient.invalidateQueries({ queryKey: ["personalDetailsAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["personalStats"] }); // Para atualizar dashboard do personal
      queryClient.invalidateQueries({ queryKey: ["personalPlanHistory"] }); // Invalida histórico
      queryClient.invalidateQueries({ queryKey: ["adminSummaryStats"] }); // Invalida stats do admin
      toast({ title: "Sucesso!", description: "Plano atribuído ao personal trainer." });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao atribuir plano", description: err.message });
    },
  });
}