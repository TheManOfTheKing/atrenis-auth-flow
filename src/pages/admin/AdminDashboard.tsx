import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Dumbbell, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

// Dados de exemplo para o gráfico de crescimento (substituir por dados reais se houver uma função de banco de dados para isso)
const growthData = [
  { mes: 'Jan', personals: 10, alunos: 50 },
  { mes: 'Fev', personals: 15, alunos: 80 },
  { mes: 'Mar', personals: 22, alunos: 120 },
  { mes: 'Abr', personals: 30, alunos: 180 },
  { mes: 'Mai', personals: 42, alunos: 250 },
  { mes: 'Jun', personals: 55, alunos: 350 },
];

export default function AdminDashboard() {
  const fetchAdminStats = async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Total de Personal Trainers
    const { count: totalPersonals } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'personal');

    // Novos personals este mês
    const { count: novosPersonalsEsteMes } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'personal')
      .gte('created_at', startOfMonth.toISOString());

    // Total de Alunos
    const { count: totalAlunos } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'aluno');

    // Novos alunos este mês
    const { count: novosAlunosEsteMes } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'aluno')
      .gte('created_at', startOfMonth.toISOString());

    // Total de Treinos
    const { count: totalTreinos } = await supabase
      .from('treinos')
      .select('*', { count: 'exact', head: true });

    // Treinos ativos
    const { count: treinosAtivos } = await supabase
      .from('treinos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true); // Corrigido para 'ativo'

    // Execuções últimos 30 dias
    const { count: execucoesUltimos30Dias } = await supabase
      .from('treino_execucoes')
      .select('*', { count: 'exact', head: true })
      .gte('data_execucao', thirtyDaysAgo.toISOString());

    return {
      totalPersonals: totalPersonals || 0,
      novosPersonalsEsteMes: novosPersonalsEsteMes || 0,
      totalAlunos: totalAlunos || 0,
      novosAlunosEsteMes: novosAlunosEsteMes || 0,
      totalTreinos: totalTreinos || 0,
      treinosAtivos: treinosAtivos || 0,
      execucoesUltimos30Dias: execucoesUltimos30Dias || 0,
      mediaExecucoesPorDia: Math.round((execucoesUltimos30Dias || 0) / 30)
    };
  };

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["adminStats"],
    queryFn: fetchAdminStats,
  });

  if (error) {
    return <div className="text-destructive">Erro ao carregar estatísticas: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativa</h1>
        <p className="text-muted-foreground">Visão geral e gestão da plataforma Atrenis</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total de Personal Trainers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Personal Trainers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalPersonals}</div>
              <p className="text-xs text-green-600 mt-1">
                +{stats?.novosPersonalsEsteMes} este mês
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total de Alunos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alunos Cadastrados
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalAlunos}</div>
              <p className="text-xs text-green-600 mt-1">
                +{stats?.novosAlunosEsteMes} este mês
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Treinos Criados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Treinos Criados
              </CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalTreinos}</div>
              <p className="text-xs text-blue-600 mt-1">
                {stats?.treinosAtivos} ativos
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Execuções de Treino */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Execuções (30 dias)
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.execucoesUltimos30Dias}</div>
              <p className="text-xs text-purple-600 mt-1">
                Média: {stats?.mediaExecucoesPorDia}/dia
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Crescimento da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="personals" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Personal Trainers"
                />
                <Line 
                  type="monotone" 
                  dataKey="alunos" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Alunos"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}