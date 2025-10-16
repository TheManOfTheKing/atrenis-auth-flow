import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dumbbell, CheckCircle, Activity, Star, PlayCircle, History, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlunoStats } from "@/hooks/useAlunoStats"; // Importar o novo hook
import { useAlunoActiveWorkouts } from "@/hooks/useAlunoActiveWorkouts"; // Importar o novo hook
import { useUpcomingAppointments } from "@/hooks/useUpcomingAppointments"; // Importar o novo hook
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AlunoDashboard() {
  const navigate = useNavigate();
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Aluno");
  const [personalName, setPersonalName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAlunoId(user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nome, personal_id')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserName(profile.nome.split(' ')[0]); // Pega apenas o primeiro nome
          if (profile.personal_id) {
            const { data: personalProfile } = await supabase
              .from('profiles')
              .select('nome')
              .eq('id', profile.personal_id)
              .single();
            if (personalProfile) {
              setPersonalName(personalProfile.nome);
            }
          }
        } else if (error) {
          console.error("Erro ao buscar perfil do aluno:", error);
        }
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  // Query para estatísticas do aluno usando a função RPC
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useAlunoStats();

  // Query para treinos ativos do aluno
  const { data: treinosAtivos, isLoading: isLoadingTreinos, error: treinosError } = useAlunoActiveWorkouts(alunoId);

  // Query para próximos agendamentos
  const { data: upcomingAppointments, isLoading: isLoadingAppointments, error: appointmentsError } = useUpcomingAppointments(alunoId);

  if (statsError || treinosError || appointmentsError) {
    return <div className="text-destructive">Erro ao carregar dados: {statsError?.message || treinosError?.message || appointmentsError?.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Seção de Boas-Vindas */}
      <div>
        <h1 className="text-3xl font-bold">Olá, {userName}! 👋</h1>
        {personalName && (
          <p className="text-muted-foreground">Seu personal: {personalName}</p>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treinos Ativos</CardTitle>
            <Dumbbell className="h-4 w-4 text-secondary-blue" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.treinos_ativos || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treinos Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-secondary-green" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.treinos_concluidos || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Treinos Feitos</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.total_execucoes || 0}</div>}
            <p className="text-xs text-muted-foreground">execuções realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Este Mês</CardTitle>
            <CalendarDays className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.execucoes_mes || 0}</div>}
            <p className="text-xs text-muted-foreground">execuções no mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Avaliação</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : (
              <div className="text-2xl font-bold">
                {stats?.media_avaliacao ? stats.media_avaliacao.toFixed(1) : '-'} ⭐
              </div>
            )}
            <p className="text-xs text-muted-foreground">sua média de avaliação</p>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Próximos Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAppointments ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 3).map((agendamento) => (
                <div key={agendamento.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <p className="font-medium">
                      {format(new Date(agendamento.data_hora), "PPP 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tipo: {agendamento.tipo?.charAt(0).toUpperCase() + agendamento.tipo?.slice(1) || 'N/A'}
                    </p>
                    {agendamento.localizacao && (
                      <p className="text-xs text-muted-foreground">Local: {agendamento.localizacao}</p>
                    )}
                  </div>
                  <Badge variant={agendamento.status === 'agendado' ? 'secondary' : 'default'}>
                    {agendamento.status?.charAt(0).toUpperCase() + agendamento.status?.slice(1) || 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Nenhum agendamento próximo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}