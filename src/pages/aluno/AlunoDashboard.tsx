import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dumbbell, CheckCircle, Activity, Star, PlayCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type AlunoTreinoWithDetails = Tables<'aluno_treinos'> & {
  treino: (Tables<'treinos'> & {
    treino_exercicios: { count: number }[];
  }) | null;
};

export default function AlunoDashboard() {
  const navigate = useNavigate();
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Aluno");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAlunoId(user.id);
        const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user.id).single();
        if (profile) {
          setUserName(profile.nome.split(' ')[0]); // Pega apenas o primeiro nome
        }
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  // Query para estatísticas do aluno usando a função RPC
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ["alunoStats", alunoId],
    queryFn: async () => {
      if (!alunoId) return null;
      const { data, error } = await supabase.rpc('get_aluno_stats', { aluno_uuid: alunoId });
      if (error) throw error;
      return data[0]; // A função retorna um array, pegamos o primeiro elemento
    },
    enabled: !!alunoId,
  });

  // Query para treinos ativos do aluno
  const { data: treinosAtivos, isLoading: isLoadingTreinos, error: treinosError } = useQuery<AlunoTreinoWithDetails[]>({
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

  if (statsError || treinosError) {
    return <div className="text-destructive">Erro ao carregar dados: {statsError?.message || treinosError?.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Olá, {userName}!</h1>
        <p className="text-muted-foreground">Bem-vindo ao seu dashboard de treinos.</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treinos Ativos</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.treinos_ativos || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treinos Concluídos (Mês)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.treinos_concluidos || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos finalizados este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.total_execucoes || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Avaliação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : (
              <div className="text-2xl font-bold">
                {stats?.media_avaliacao ? stats.media_avaliacao.toFixed(1) : '-'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">avaliação média</p>
          </CardContent>
        </Card>
      </div>

      {/* Meus Treinos Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Meus Treinos Ativos</CardTitle>
          <Link to="/aluno/historico">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" /> Ver Histórico
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoadingTreinos ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : treinosAtivos && treinosAtivos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {treinosAtivos.map((alunoTreino) => (
                <Card key={alunoTreino.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{alunoTreino.treino?.nome}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alunoTreino.treino?.descricao || "Sem descrição."}
                        </p>
                      </div>
                      <Badge>{alunoTreino.treino?.tipo}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>⏱️ {alunoTreino.treino?.duracao_estimada_min || 0} min</span>
                      <span>💪 {alunoTreino.treino?.treino_exercicios[0]?.count || 0} exercícios</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90"
                      onClick={() => navigate(`/aluno/treino/${alunoTreino.id}`)}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" /> Iniciar Treino
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Nenhum treino ativo atribuído ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}