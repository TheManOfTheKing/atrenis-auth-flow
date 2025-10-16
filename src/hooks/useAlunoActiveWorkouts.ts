import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type AlunoTreinoWithDetails = Tables<'aluno_treinos'> & {
  treino: (Tables<'treinos'> & {
    treino_exercicios: { count: number }[];
  }) | null;
};

export function useAlunoActiveWorkouts(alunoId: string | null) {
  return useQuery<AlunoTreinoWithDetails[], Error>({
    queryKey: ["alunoActiveWorkouts", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      const { data, error } = await supabase
        .from('aluno_treinos')
        .select(`
          *,
          treino:treinos(
            nome,
            descricao,
            tipo,
            duracao_estimada_min,
            treino_exercicios(count)
          )
        `)
        .eq('aluno_id', alunoId)
        .eq('status', 'ativo')
        .order('data_atribuicao', { ascending: false });

      if (error) throw error;
      return data as AlunoTreinoWithDetails[];
    },
    enabled: !!alunoId,
  });
}