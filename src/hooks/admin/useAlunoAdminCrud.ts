import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ToggleAlunoStatusData {
  id: string;
  ativo: boolean;
  motivo?: string;
}

export function useAlunoAdminCrud() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Ativar/Desativar aluno
  const toggleAlunoStatus = useMutation({
    mutationFn: async (data: ToggleAlunoStatusData) => {
      const { data: result, error } = await supabase.rpc('toggle_aluno_status', {
        p_aluno_id: data.id,
        p_ativo: data.ativo,
        p_motivo: data.motivo || null
      });

      if (error) throw error;
      
      const response = result as unknown as { success: boolean; error?: string };
      if (!response.success) {
        throw new Error(response.error || 'Erro ao alterar status');
      }
      
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-alunos'] });
      toast({
        title: 'Sucesso!',
        description: variables.ativo 
          ? 'Aluno ativado com sucesso' 
          : 'Aluno desativado com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alterar o status',
        variant: 'destructive'
      });
    }
  });

  return {
    toggleAlunoStatus
  };
}
