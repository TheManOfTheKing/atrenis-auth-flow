import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users, Dumbbell, Activity, TrendingUp, PlusCircle, CreditCard, CalendarDays, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePersonalStats } from "@/hooks/usePersonalStats"; // Importar o novo hook
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";

export default function PersonalDashboard() {
  const [personalId, setPersonalId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setPersonalId(user.id);
      }
    };
    fetchUser();
  }, []);

  const { data: stats, isLoading: isLoadingStats, error: statsError } = usePersonalStats();

  const { data: personalProfile, isLoading: isLoadingProfile, error: profileError } = useQuery<Tables<'profiles'> | null>({
    queryKey: ["personalProfile", personalId],
    queryFn: async () => {
      if (!personalId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          plan:plans(nome, recursos, max_alunos, tipo)
        `)
        .eq('id', personalId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!personalId,
  });

  if (statsError || profileError) {
    return <div className="text-destructive">Erro ao carregar dados: {statsError?.message || profileError?.message}</div>;
  }

  const plan = personalProfile?.plan as (Tables<'plans'> | null | undefined);
  const isVitalicio = personalProfile?.plano_vitalicio || plan?.tipo === 'vitalicio';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Personal</h1>
        <p className="text-muted-foreground">Visão geral dos seus alunos e treinos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-blue">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-secondary-blue" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.total_alunos || 0}</div>}
            <p className="text-xs text-muted-foreground">alunos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-green">Treinos Criados</CardTitle>
            <Dumbbell className="h-4 w-4 text-secondary-green" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.total_treinos || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos disponíveis</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Execuções Realizadas</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.total_execucoes || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos executados</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in delay-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Execuções Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.execucoes_mes || 0}</div>}
            <p className="text-xs text-muted-foreground">execuções no mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Card "Meu Plano" */}
      <Card className="animate-fade-in delay-400">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meu Plano</CardTitle>
          <CreditCard className="h-4 w-4 text-primary-yellow" />
        </CardHeader>
        <CardContent>
          {isLoadingProfile ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : personalProfile?.plan_id ? (
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{plan?.nome}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{stats?.total_alunos || 0} de {plan?.max_alunos === 0 ? 'ilimitados' : plan?.max_alunos} alunos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>
                  Próximo vencimento:{" "}
                  {isVitalicio ? (
                    <Badge className="bg-purple-600 text-white">Vitalício</Badge>
                  ) : personalProfile.data_vencimento ? (
                    format(new Date(personalProfile.data_vencimento), "PPP", { locale: ptBR })
                  ) : (
                    "N/A"
                  )}
                </span>
              </div>
              {plan?.recursos && (plan.recursos as string[]).length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-sm mb-1">Recursos Incluídos:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {(plan.recursos as string[]).map((recurso, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-secondary-green" /> {recurso}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Você ainda não tem um plano atribuído.</p>
          )}
        </CardContent>
        <CardFooter>
          {!isVitalicio && (
            <Button className="w-full bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
              Fazer Upgrade
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">Ações Rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/personal/alunos/new">
            <Button className="w-full h-auto py-4 bg-secondary-blue text-white hover:bg-secondary-blue/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Novo Aluno
            </Button>
          </Link>
          <Link to="/personal/treinos/new">
            <Button className="w-full h-auto py-4 bg-secondary-green text-white hover:bg-secondary-green/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Treino
            </Button>
          </Link>
          <Link to="/personal/exercicios/new">
            <Button className="w-full h-auto py-4 bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Exercício
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}