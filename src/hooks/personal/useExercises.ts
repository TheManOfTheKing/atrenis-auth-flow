import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Exercise {
  id: string;
  nome: string;
  descricao?: string;
  grupo_muscular: string;
  equipamento?: string;
  dificuldade?: string;
  video_url?: string;
  imagem_url?: string;
  publico: boolean;
  personal_id?: string;
  created_at: string;
  updated_at: string;
}

export function useExercises(searchTerm?: string, grupoMuscular?: string) {
  return useQuery({
    queryKey: ['exercicios', searchTerm, grupoMuscular],
    queryFn: async () => {
      try {
        // Se há termo de busca ou grupo muscular, usar RPC function
        if (searchTerm || grupoMuscular) {
          const { data, error } = await supabase.rpc('search_exercicios', {
            search_term: searchTerm || null,
            grupo: grupoMuscular || null
          });
          
          if (error) {
            console.error('Erro na RPC search_exercicios:', error);
            throw error;
          }
          
          return data || [];
        } else {
          // Query direta para listar todos os exercícios
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            throw new Error('Usuário não autenticado');
          }

          const { data, error } = await supabase
            .from('exercicios')
            .select('*')
            .or(`publico.eq.true,personal_id.eq.${user.id}`)
            .order('nome');

          if (error) {
            console.error('Erro ao buscar exercícios:', error);
            throw error;
          }

          return data || [];
        }
      } catch (error) {
        console.error('Erro no useExercises:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos (TanStack Query v5)
  });
}

export function useExerciseById(exerciseId: string) {
  return useQuery({
    queryKey: ['exercicio', exerciseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercicios')
        .select('*')
        .eq('id', exerciseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
