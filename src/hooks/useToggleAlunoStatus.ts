import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ToggleAlunoStatusParams {
  alunoId: string;
  ativo: boolean;
  motivo?: string;
}

interface ToggleAlunoStatusResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function useToggleAlunoStatus() {
  const queryClient = useQueryClient();

  return useMutation<ToggleAlunoStatusResponse, Error, ToggleAlunoStatusParams>({
    mutationFn: async (params: ToggleAlunoStatusParams) => {
      const { data, error } = await supabase.rpc('toggle_aluno_status', {
        p_aluno_id: params.alunoId,
        p_ativo: params.ativo,
        p_motivo: params.motivo || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: ToggleAlunoStatusResponse = data as ToggleAlunoStatusResponse;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao alterar status do aluno.");
      }

      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["personalStudents"] });
      queryClient.invalidateQueries({ queryKey: ["alunoActiveWorkouts", variables.alunoId] }); // Invalida cache do aluno específico
      queryClient.invalidateQueries({ queryKey: ["alunoStats", variables.alunoId] }); // Invalida cache de stats do aluno
      toast({
        title: "Sucesso!",
        description: variables.ativo ? "Aluno reativado com sucesso." : "Aluno desativado com sucesso.",
      });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao alterar status do aluno", description: err.message });
    },
  });
}