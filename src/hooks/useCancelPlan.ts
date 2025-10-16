import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CancelPlanParams {
  personalId: string;
  motivo_cancelamento?: string;
  cancel_immediately?: boolean;
}

interface CancelPlanResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function useCancelPlan() {
  const queryClient = useQueryClient();

  return useMutation<CancelPlanResponse, Error, CancelPlanParams>({
    mutationFn: async (params: CancelPlanParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase.rpc('cancel_plan_for_personal', {
        p_personal_id: params.personalId,
        p_motivo_cancelamento: params.motivo_cancelamento || null,
        p_cancel_immediately: params.cancel_immediately || false,
        p_admin_id: user.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: CancelPlanResponse = data as CancelPlanResponse;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao cancelar plano.");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPersonalTrainers"] });
      queryClient.invalidateQueries({ queryKey: ["personalDetailsAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["personalStats"] });
      queryClient.invalidateQueries({ queryKey: ["personalPlanHistory"] });
      queryClient.invalidateQueries({ queryKey: ["adminSummaryStats"] });
      toast({ title: "Sucesso!", description: "Plano cancelado com sucesso." });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao cancelar plano", description: err.message });
    },
  });
}