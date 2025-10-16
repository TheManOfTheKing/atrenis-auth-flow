import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { personalAdminSchema } from "@/lib/validations";
import { z } from "zod";

type PersonalFormData = z.infer<typeof personalAdminSchema>;

interface CreatePersonalResponse {
  success: boolean;
  personal_id?: string;
  email?: string;
  temp_password?: string;
  message?: string;
  error?: string;
}

interface GenericPersonalResponse {
  success: boolean;
  message?: string;
  error?: string;
  new_password?: string; // Para reset de senha
}

export function useCreatePersonalByAdmin() {
  const queryClient = useQueryClient();

  return useMutation<CreatePersonalResponse, Error, PersonalFormData>({
    mutationFn: async (params: PersonalFormData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke('create-personal', {
        body: {
          email: params.email,
          nome: params.nome,
          telefone: params.telefone || null,
          cref: params.cref || null,
          plan_id: params.planId || null,
          desconto_percentual: params.desconto_percentual,
          periodo: params.periodo === 'none' ? null : params.periodo,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: CreatePersonalResponse = data;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao criar personal trainer.");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPersonalTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['adminSummaryStats'] });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao criar personal trainer", description: err.message });
    },
  });
}

export function useUpdatePersonalByAdmin() {
  const queryClient = useQueryClient();

  return useMutation<GenericPersonalResponse, Error, PersonalFormData>({
    mutationFn: async (params: PersonalFormData) => {
      if (!params.id) throw new Error("ID do personal é obrigatório para atualização.");

      const { data, error } = await supabase.rpc('update_personal_by_admin', {
        p_personal_id: params.id,
        p_nome: params.nome,
        p_email: params.email,
        p_telefone: params.telefone || null,
        p_cref: params.cref || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: GenericPersonalResponse = data as GenericPersonalResponse;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao atualizar personal trainer.");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPersonalTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['personalDetailsAdmin'] });
      toast({ title: "Sucesso!", description: "Personal trainer atualizado com sucesso." });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao atualizar personal trainer", description: err.message });
    },
  });
}

export function useTogglePersonalStatusAdmin() {
  const queryClient = useQueryClient();

  return useMutation<GenericPersonalResponse, Error, { personalId: string; ativo: boolean; motivo?: string }>({
    mutationFn: async (params) => {
      const { data, error } = await supabase.rpc('toggle_personal_status_admin', {
        p_personal_id: params.personalId,
        p_ativo: params.ativo,
        p_motivo: params.motivo || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: GenericPersonalResponse = data as GenericPersonalResponse;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao alterar status do personal trainer.");
      }

      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminPersonalTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['personalDetailsAdmin', variables.personalId] });
      queryClient.invalidateQueries({ queryKey: ['adminSummaryStats'] });
      toast({ title: "Sucesso!", description: `Personal trainer ${variables.ativo ? 'ativado' : 'desativado'} com sucesso.` });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao alterar status do personal trainer", description: err.message });
    },
  });
}

export function useDeletePersonalByAdmin() {
  const queryClient = useQueryClient();

  return useMutation<GenericPersonalResponse, Error, string>({
    mutationFn: async (personalId: string) => {
      const { data, error } = await supabase.rpc('delete_personal_by_admin', {
        p_personal_id: personalId,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: GenericPersonalResponse = data as GenericPersonalResponse;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao deletar personal trainer.");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPersonalTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['adminSummaryStats'] });
      toast({ title: "Sucesso!", description: "Personal trainer deletado com sucesso." });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao deletar personal trainer", description: err.message });
    },
  });
}

export function useResetPersonalPasswordAdmin() {
  const queryClient = useQueryClient();

  return useMutation<GenericPersonalResponse, Error, string>({
    mutationFn: async (personalId: string) => {
      const { data, error } = await supabase.rpc('reset_personal_password_admin', {
        p_personal_id: personalId,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: GenericPersonalResponse = data as GenericPersonalResponse;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao resetar senha.");
      }

      return result;
    },
    onSuccess: (data) => {
      toast({ title: "Sucesso!", description: `Nova senha temporária: ${data.new_password}` });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao resetar senha", description: err.message });
    },
  });
}