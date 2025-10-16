import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateAlunoParams {
  email: string;
  nome: string;
  telefone?: string;
  data_nascimento?: string; // formato: YYYY-MM-DD
  objetivo?: string;
  observacoes?: string;
}

interface CreateAlunoResponse {
  success: boolean;
  aluno_id?: string;
  email?: string;
  temp_password?: string;
  message?: string;
  error?: string;
}

export function useCreateAluno() {
  const queryClient = useQueryClient();

  return useMutation<CreateAlunoResponse, Error, CreateAlunoParams>({
    mutationFn: async (params: CreateAlunoParams) => {
      const { data, error } = await supabase.rpc('create_aluno_by_personal', {
        p_email: params.email,
        p_nome: params.nome,
        p_telefone: params.telefone || null,
        p_data_nascimento: params.data_nascimento || null,
        p_objetivo: params.objetivo || null,
        p_observacoes: params.observacoes || null,
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // A função RPC retorna um objeto JSON, precisamos parseá-lo
      const rpcResult: CreateAlunoResponse = data;

      if (!rpcResult.success) {
        throw new Error(rpcResult.error || "Erro desconhecido ao criar aluno.");
      }

      return rpcResult;
    },
    onSuccess: () => {
      // Invalida a query 'personalStudents' para atualizar a lista de alunos
      queryClient.invalidateQueries({ queryKey: ['personalStudents'] });
    },
  });
}