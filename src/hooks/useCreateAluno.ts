import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateAlunoParams {
  email: string;
  nome: string;
  telefone?: string;
  data_nascimento?: string;
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke('create-aluno', {
        body: {
          email: params.email,
          nome: params.nome,
          telefone: params.telefone || null,
          data_nascimento: params.data_nascimento || null,
          objetivo: params.objetivo || null,
          observacoes: params.observacoes || null,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const result: CreateAlunoResponse = data;

      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao criar aluno.");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalStudents'] });
    },
  });
}