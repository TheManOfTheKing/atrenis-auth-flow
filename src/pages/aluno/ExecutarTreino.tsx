import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play, Star, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type AlunoTreinoWithFullDetails = Tables<'aluno_treinos'> & {
  treino: (Tables<'treinos'> & {
    treino_exercicios: (Tables<'treino_exercicios'> & {
      exercicio: Tables<'exercicios'> | null;
    })[];
  }) | null;
};

export default function ExecutarTreino() {
  const { alunoTreinoId } = useParams<{ alunoTreinoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [exerciciosConcluidos, setExerciciosConcluidos] = useState<Set<string>>(new Set());
  const [tempoInicio, setTempoInicio] = useState<number>(Date.now());
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);
  const [avaliacao, setAvaliacao] = useState(0);
  const [feedbackAluno, setFeedbackAluno] = useState('');
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

  const { data: alunoTreino, isLoading, error } = useQuery<AlunoTreinoWithFullDetails>({
    queryKey: ["executarTreino", alunoTreinoId],
    queryFn: async () => {
      if (!alunoTreinoId) throw new Error("ID do treino do aluno não fornecido.");
      const { data, error } = await supabase
        .from('aluno_treinos')
        .select(`
          *,
          treino:treinos(
            id,
            nome,
            descricao,
            tipo,
            duracao_estimada_min,
            treino_exercicios(
              id,
              ordem,
              series,
              repeticoes,
              carga,
              descanso_seg,
              observacoes,
              exercicio:exercicios(id, nome, descricao, grupo_muscular, video_url)
            )
          )
        `)
        .eq('id', alunoTreinoId)
        .single();

      if (error) throw error;
      
      // Ordenar exercícios por ordem
      if (data.treino?.treino_exercicios) {
        data.treino.treino_exercicios.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      }
      return data as AlunoTreinoWithFullDetails;
    },
    enabled: !!alunoTreinoId,
  });

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoDecorrido(Math.floor((Date.now() - tempoInicio) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [tempoInicio]);

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const handleFinalizarTreino = () => {
    if (!alunoTreino?.treino?.treino_exercicios || exerciciosConcluidos.size < alunoTreino.treino.treino_exercicios.length) {
      toast({
        variant: "destructive",
        title: "Treino Incompleto",
        description: "Por favor, marque todos os exercícios como concluídos antes de finalizar o treino.",
      });
      return;
    }
    setShowAvaliacaoModal(true);
  };

  const saveExecutionMutation = useMutation({
    mutationFn: async () => {
      if (!alunoId || !alunoTreino) throw new Error("Dados de usuário ou treino ausentes.");

      const { error } = await supabase
        .from('treino_execucoes')
        .insert({
          aluno_id: alunoId,
          aluno_treino_id: alunoTreino.id,
          data_execucao: new Date().toISOString(),
          tempo_execucao_min: Math.floor(tempoDecorrido / 60),
          avaliacao: avaliacao,
          feedback_aluno: feedbackAluno || null,
          exercicios_concluidos: Array.from(exerciciosConcluidos) as any, // Supabase JSONB
        });

      if (error) throw error;

      // Atualizar status do aluno_treino para 'concluido'
      await supabase
        .from('aluno_treinos')
        .update({ status: 'concluido' })
        .eq('id', alunoTreino.id);
    },
    onSuccess: () => {
      toast({
        title: "Treino concluído!",
        description: "Sua execução e avaliação foram salvas com sucesso. 🎉",
      });
      queryClient.invalidateQueries({ queryKey: ["alunoStats"] });
      queryClient.invalidateQueries({ queryKey: ["alunoActiveWorkouts"] });
      queryClient.invalidateQueries({ queryKey: ["alunoWorkoutHistory"] });
      navigate('/aluno/dashboard');
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar treino",
        description: err.message,
      });
    },
  });

  const handleSaveAndExit = async () => {
    if (!alunoId || !alunoTreino) {
      toast({ variant: "destructive", title: "Erro", description: "Dados de usuário ou treino ausentes." });
      return;
    }

    try {
      // Salvar progresso atual como uma execução parcial ou apenas sair
      // Para simplificar, vamos apenas navegar de volta e o estado não será persistido
      // Uma implementação completa exigiria um campo 'progresso_atual' no aluno_treinos
      toast({
        title: "Treino pausado!",
        description: "Você pode iniciar novamente a qualquer momento.",
      });
      navigate('/aluno/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao pausar treino",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    );
  }

  if (error || !alunoTreino || !alunoTreino.treino) {
    return <div className="text-destructive text-center p-8">Erro ao carregar treino: {error?.message || "Treino não encontrado."}</div>;
  }

  const totalExercicios = alunoTreino.treino.treino_exercicios?.length || 0;
  const progressoAtual = totalExercicios > 0 ? (exerciciosConcluidos.size / totalExercicios) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header com Timer */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{alunoTreino.treino.nome}</h1>
          <p className="text-muted-foreground">{alunoTreino.treino.tipo}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-primary-yellow">
            {formatarTempo(tempoDecorrido)}
          </div>
          <p className="text-sm text-muted-foreground">Tempo decorrido</p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Progresso Geral */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Progresso Geral</span>
            <span className="text-muted-foreground">
              {exerciciosConcluidos.size} / {totalExercicios} exercícios
            </span>
          </div>
          <Progress value={progressoAtual} />
        </CardContent>
      </Card>

      {/* Lista de Exercícios */}
      <div className="space-y-4">
        {alunoTreino.treino.treino_exercicios?.map((treinoEx, index) => (
          <Card
            key={treinoEx.id}
            className={exerciciosConcluidos.has(treinoEx.id) ? 'opacity-60 transition-opacity' : 'transition-opacity'}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <Checkbox
                  checked={exerciciosConcluidos.has(treinoEx.id)}
                  onCheckedChange={(checked) => {
                    const newSet = new Set(exerciciosConcluidos);
                    if (checked) {
                      newSet.add(treinoEx.id);
                    } else {
                      newSet.delete(treinoEx.id);
                    }
                    setExerciciosConcluidos(newSet);
                  }}
                  className="mt-1"
                />

                {/* Informações do Exercício */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <h3 className="text-lg font-semibold">
                      {index + 1}. {treinoEx.exercicio?.nome || "Exercício Desconhecido"}
                    </h3>
                    {treinoEx.exercicio?.grupo_muscular && <Badge variant="outline">{treinoEx.exercicio.grupo_muscular}</Badge>}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {treinoEx.exercicio?.descricao || "Sem descrição."}
                  </p>

                  {/* Configurações */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-muted p-2 rounded text-center">
                      <p className="text-xs text-muted-foreground">Séries</p>
                      <p className="font-bold">{treinoEx.series || '-'}</p>
                    </div>
                    <div className="bg-muted p-2 rounded text-center">
                      <p className="text-xs text-muted-foreground">Repetições</p>
                      <p className="font-bold">{treinoEx.repeticoes || '-'}</p>
                    </div>
                    <div className="bg-muted p-2 rounded text-center">
                      <p className="text-xs text-muted-foreground">Carga</p>
                      <p className="font-bold">{treinoEx.carga || '-'}</p>
                    </div>
                    <div className="bg-muted p-2 rounded text-center">
                      <p className="text-xs text-muted-foreground">Descanso</p>
                      <p className="font-bold">{treinoEx.descanso_seg || '-'}s</p>
                    </div>
                  </div>

                  {/* Observações */}
                  {treinoEx.observacoes && (
                    <p className="text-sm text-blue-600 italic">
                      💡 {treinoEx.observacoes}
                    </p>
                  )}

                  {/* Vídeo (se disponível) */}
                  {treinoEx.exercicio?.video_url && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => window.open(treinoEx.exercicio?.video_url || '', '_blank')}
                      className="mt-2 p-0"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Ver Vídeo Demonstrativo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botões de Ação */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleSaveAndExit}
        >
          Pausar e Sair
        </Button>
        <Button
          className="flex-1 bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90"
          onClick={handleFinalizarTreino}
          disabled={exerciciosConcluidos.size < totalExercicios || saveExecutionMutation.isPending}
        >
          {saveExecutionMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizando...
            </>
          ) : (
            'Finalizar Treino'
          )}
        </Button>
      </div>

      {/* Modal de Avaliação */}
      <Dialog open={showAvaliacaoModal} onOpenChange={setShowAvaliacaoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parabéns! 🎉</DialogTitle>
            <DialogDescription>
              Você concluiu o treino em {formatarTempo(tempoDecorrido)}. 
              Como foi sua experiência?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Avaliação com Estrelas */}
            <div>
              <Label htmlFor="avaliacao">Avaliação</Label>
              <div className="flex items-center gap-2 mt-2" id="avaliacao">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-8 w-8 cursor-pointer transition ${
                      star <= avaliacao
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                    onClick={() => setAvaliacao(star)}
                  />
                ))}
              </div>
            </div>

            {/* Comentário */}
            <div>
              <Label htmlFor="feedbackAluno">Comentário (opcional)</Label>
              <Textarea
                id="feedbackAluno"
                placeholder="Como você se sentiu durante o treino? Alguma dificuldade?"
                rows={4}
                value={feedbackAluno}
                onChange={(e) => setFeedbackAluno(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAvaliacaoModal(false)}
              disabled={saveExecutionMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90"
              onClick={() => saveExecutionMutation.mutate()}
              disabled={avaliacao === 0 || saveExecutionMutation.isPending}
            >
              {saveExecutionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                'Enviar Avaliação'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}