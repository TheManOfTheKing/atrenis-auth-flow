import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, History, MessageSquare, Dumbbell, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

type TreinoExecucaoWithDetails = Tables<'treino_execucoes'> & {
  treino: Tables<'treinos'> | null;
  comentarios: Tables<'comentarios'>[];
};

export default function AlunoHistorico() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate = useNavigate();
  const [personalId, setPersonalId] = useState<string | null>(null);
  const [alunoNome, setAlunoNome] = useState<string>("");

  useEffect(() => {
    const fetchUserAndAluno = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setPersonalId(user.id);
        if (alunoId) {
          const { data: alunoProfile, error } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', alunoId)
            .single();
          if (alunoProfile) {
            setAlunoNome(alunoProfile.nome);
          } else if (error) {
            console.error("Erro ao buscar nome do aluno:", error);
          }
        }
      } else {
        navigate("/login");
      }
    };
    fetchUserAndAluno();
  }, [navigate, alunoId]);

  const { data: historico, isLoading, error } = useQuery<TreinoExecucaoWithDetails[]>({
    queryKey: ["alunoWorkoutHistoryPersonalView", alunoId, personalId],
    queryFn: async () => {
      if (!alunoId || !personalId) return [];
      const { data, error } = await supabase
        .from('treino_execucoes')
        .select(`
          *,
          aluno_treino:aluno_treinos!inner(
            treino:treinos(nome, tipo)
          ),
          comentarios(mensagem, autor_id)
        `)
        .eq('aluno_id', alunoId)
        .order('data_execucao', { ascending: false });

      if (error) throw error;
      
      // Ajustar a estrutura para corresponder ao tipo esperado
      return data.map(exec => ({
        ...exec,
        treino: exec.aluno_treino?.treino || null, // Extrai o objeto treino aninhado
      })) as TreinoExecucaoWithDetails[];
    },
    enabled: !!alunoId && !!personalId,
  });

  if (error) {
    return <div className="text-destructive text-center p-8">Erro ao carregar histórico: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Treinos de {alunoNome}</h1>
          <p className="text-muted-foreground">Visualize as execuções passadas e feedbacks do seu aluno.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/personal/alunos")}>
          <History className="h-4 w-4 mr-2" /> Voltar para Alunos
        </Button>
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
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {execucao.tempo_execucao_min} minutos
                    </span>
                  )}
                </div>

                {execucao.feedback_aluno && (
                  <p className="text-sm text-muted-foreground italic mb-3">
                    "Feedback do aluno: {execucao.feedback_aluno}"
                  </p>
                )}

                {/* Comentários do Personal */}
                {execucao.comentarios && execucao.comentarios.length > 0 && (
                  <div className="bg-blue-50 border-l-4 border-secondary-blue p-3 rounded">
                    <p className="text-sm font-medium text-secondary-blue mb-1 flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" /> Seu Feedback:
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Dumbbell className="h-24 w-24 text-muted-foreground mb-6" />
          <h3 className="text-2xl font-bold mb-2">Nenhuma execução de treino encontrada</h3>
          <p className="text-muted-foreground mb-6">
            Este aluno ainda não realizou nenhum treino.
          </p>
        </div>
      )}
    </div>
  );
}