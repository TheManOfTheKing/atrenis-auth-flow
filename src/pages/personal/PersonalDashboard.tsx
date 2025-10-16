import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dumbbell, Activity, TrendingUp, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePersonalStats } from "@/hooks/usePersonalStats"; // Importar o novo hook

export default function PersonalDashboard() {
  const { data: stats, isLoading, error } = usePersonalStats();

  if (error) {
    return <div className="text-destructive">Erro ao carregar estatísticas: {error.message}</div>;
  }

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
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.total_alunos || 0}</div>}
            <p className="text-xs text-muted-foreground">alunos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-green">Treinos Criados</CardTitle>
            <Dumbbell className="h-4 w-4 text-secondary-green" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.total_treinos || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos disponíveis</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Execuções Realizadas</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.total_execucoes || 0}</div>}
            <p className="text-xs text-muted-foreground">treinos executados</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in delay-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Execuções Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats?.execucoes_mes || 0}</div>}
            <p className="text-xs text-muted-foreground">execuções no mês</p>
          </CardContent>
        </Card>
      </div>

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