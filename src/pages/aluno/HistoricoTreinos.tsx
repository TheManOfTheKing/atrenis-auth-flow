import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, History, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TreinoExecucaoWithDetails = Tables<'treino_execucoes'> & {
  treino: Tables<'treinos'> | null;
  comentarios: Tables<'comentarios'>[];
};

export default function HistoricoTreinos() {
  const navigate = useNavigate();
  const [alunoId, setAlunoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAlunoId(user.id);
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const { data: historico, isLoading, error } = useQuery<TreinoExecucaoWithDetails[]>({
    queryKey: ["alunoWorkoutHistory", alunoId],
    queryFn: async () => {
      if (!alunoId) return [];
      const { data, error } = await supabase
        .from('treino_execucoes')
        .select(`
          *,
          treino:aluno_treinos!inner(treino:treinos(nome, tipo)),
          comentarios(mensagem, autor_id)
        `)
        .eq('aluno_id', alunoId)
        .order('data_execucao', { ascending: false });

      if (error) throw error;
      
      // Ajustar a estrutura para corresponder ao tipo esperado
      return data.map(exec => ({
        ...exec,
        treino: exec.treino?.treino || null, // Extrai o objeto treino aninhado
      })) as TreinoExecucaoWithDetails[];
    },
    enabled: !!alunoId,
  });

  if (error) {
    return <div className="text-destructive">Erro ao carregar histórico: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Histórico de Treinos</h1>
        <p className="text-muted-foreground">Visualize suas execuções passadas e feedbacks.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : historico && historico.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {historico.map((execucao) => (
            <Card key={execucao.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{execucao.treino?.nome || "Treino Desconhecido"}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(execucao.data_execucao), "PPP 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {execucao.treino?.tipo && <Badge>{execucao.treino.tipo}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-3">
                  {execucao.avaliacao !== null && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (execucao.avaliacao || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {execucao.tempo_execucao_min !== null && (
                    <span className="text-sm text-muted-foreground">
                      ⏱️ {execucao.tempo_execucao_min} minutos
                    </span>
                  )}
                </div>

                {execucao.feedback_aluno && (
                  <p className="text-sm text-muted-foreground italic mb-3">
                    "Meu feedback: {execucao.feedback_aluno}"
                  </p>
                )}

                {/* Comentários do Personal */}
                {execucao.comentarios && execucao.comentarios.length > 0 && (
                  <div className="bg-blue-50 border-l-4 border-secondary-blue p-3 rounded">
                    <p className="text-sm font-medium text-secondary-blue mb-1 flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" /> Feedback do Personal:
                    </p>
                    <p className="text-sm text-gray-800">
                      {execucao.comentarios[0].mensagem}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center">Nenhuma execução de treino encontrada ainda.</p>
      )}
    </div>
  );
}