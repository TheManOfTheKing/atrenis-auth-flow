import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdatePersonalData {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cref?: string;
}

interface TogglePersonalStatusData {
  id: string;
  ativo: boolean;
  motivo?: string;
}

interface AssignPlanData {
  personal_id: string;
  plan_id: string;
  desconto_percentual: number;
  periodo: 'mensal' | 'anual' | 'vitalicio';
  data_inicio?: string;
}

export function usePersonalAdminCrud() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Atualizar dados do personal
  const updatePersonal = useMutation({
    mutationFn: async (data: UpdatePersonalData) => {
      const { data: result, error } = await supabase.rpc('update_personal_by_admin', {
        p_personal_id: data.id,
        p_nome: data.nome,
        p_email: data.email,
        p_telefone: data.telefone || null,
        p_cref: data.cref || null
      });

      if (error) throw error;
      
      const response = result as unknown as { success: boolean; error?: string };
      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar personal');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personal-trainers'] });
      toast({
        title: 'Sucesso!',
        description: 'Dados do personal trainer atualizados com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar os dados',
        variant: 'destructive'
      });
    }
  });

  // Ativar/Desativar personal
  const togglePersonalStatus = useMutation({
    mutationFn: async (data: TogglePersonalStatusData) => {
      const { data: result, error } = await supabase.rpc('toggle_personal_status_admin', {
        p_personal_id: data.id,
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
      queryClient.invalidateQueries({ queryKey: ['admin-personal-trainers'] });
      toast({
        title: 'Sucesso!',
        description: variables.ativo 
          ? 'Personal trainer ativado com sucesso' 
          : 'Personal trainer desativado com sucesso'
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

  // Deletar personal
  const deletePersonal = useMutation({
    mutationFn: async (personalId: string) => {
      const { data: result, error } = await supabase.rpc('delete_personal_by_admin', {
        p_personal_id: personalId
      });

      if (error) throw error;
      
      const response = result as unknown as { success: boolean; error?: string };
      if (!response.success) {
        throw new Error(response.error || 'Erro ao deletar personal');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personal-trainers'] });
      toast({
        title: 'Sucesso!',
        description: 'Personal trainer deletado com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível deletar o personal',
        variant: 'destructive'
      });
    }
  });

  // Resetar senha
  const resetPassword = useMutation({
    mutationFn: async (personalId: string) => {
      const { data: result, error } = await supabase.rpc('reset_personal_password_admin', {
        p_personal_id: personalId
      });

      if (error) throw error;
      
      const response = result as unknown as { 
        success: boolean; 
        temp_password?: string;
        error?: string;
      };
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao resetar senha');
      }
      
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Senha resetada!',
        description: `Nova senha temporária: ${data.temp_password}`,
      });
      
      // Copiar senha para clipboard automaticamente
      if (data.temp_password) {
        navigator.clipboard.writeText(data.temp_password);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível resetar a senha',
        variant: 'destructive'
      });
    }
  });

  // Atribuir plano
  const assignPlan = useMutation({
    mutationFn: async (data: AssignPlanData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase.rpc('assign_plan_to_personal', {
        p_personal_id: data.personal_id,
        p_plan_id: data.plan_id,
        p_desconto_percentual: data.desconto_percentual,
        p_periodo: data.periodo,
        p_data_inicio: data.data_inicio || new Date().toISOString(),
        p_admin_id: user?.id
      });

      if (error) throw error;
      
      const response = result as unknown as { success: boolean; error?: string };
      if (!response.success) {
        throw new Error(response.error || 'Erro ao atribuir plano');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personal-trainers'] });
      toast({
        title: 'Sucesso!',
        description: 'Plano atribuído com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atribuir o plano',
        variant: 'destructive'
      });
    }
  });

  // Cancelar plano
  const cancelPlan = useMutation({
    mutationFn: async ({ 
      personalId, 
      motivo, 
      immediately 
    }: { 
      personalId: string; 
      motivo?: string; 
      immediately?: boolean 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase.rpc('cancel_plan_for_personal', {
        p_personal_id: personalId,
        p_motivo_cancelamento: motivo || null,
        p_cancel_immediately: immediately || false,
        p_admin_id: user?.id
      });

      if (error) throw error;
      
      const response = result as unknown as { success: boolean; error?: string };
      if (!response.success) {
        throw new Error(response.error || 'Erro ao cancelar plano');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personal-trainers'] });
      toast({
        title: 'Sucesso!',
        description: 'Plano cancelado com sucesso'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível cancelar o plano',
        variant: 'destructive'
      });
    }
  });

  return {
    updatePersonal,
    togglePersonalStatus,
    deletePersonal,
    resetPassword,
    assignPlan,
    cancelPlan
  };
}
