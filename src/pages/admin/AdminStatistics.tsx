import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, DollarSign, TrendingUp, UserX, CalendarDays, Download, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import {
  useAdminSummaryStats,
  usePersonalsGrowthMonthly,
  useStudentsPerPersonalTop10,
  usePlansDistributionStats,
  useRecentSubscriptions,
  useExpiringSubscriptions,
  usePersonalsWithoutActivePlan,
} from "@/hooks/useAdminStatistics";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#8dd1e1'];

export default function AdminStatistics() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState("12_months"); // Default filter
  const [planFilter, setPlanFilter] = useState("all"); // Default filter for plans

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // In a real app, you'd verify the user's role here
        setAdminId(user.id);
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const { data: summaryStats, isLoading: isLoadingSummary, error: summaryError } = useAdminSummaryStats();
  const { data: personalsGrowth, isLoading: isLoadingGrowth, error: growthError } = usePersonalsGrowthMonthly();
  const { data: studentsPerPersonal, isLoading: isLoadingStudentsPerPersonal, error: studentsPerPersonalError } = useStudentsPerPersonalTop10();
  const { data: plansDistribution, isLoading: isLoadingPlansDistribution, error: plansDistributionError } = usePlansDistributionStats();
  const { data: recentSubscriptions, isLoading: isLoadingRecentSubs, error: recentSubsError } = useRecentSubscriptions();
  const { data: expiringSubscriptions, isLoading: isLoadingExpiringSubs, error: expiringSubsError } = useExpiringSubscriptions(7);
  const { data: personalsWithoutPlan, isLoading: isLoadingPersonalsWithoutPlan, error: personalsWithoutPlanError } = usePersonalsWithoutActivePlan();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({ variant: "destructive", title: "Erro na exportação", description: "Nenhum dado para exportar." });
      return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({ title: "Exportação concluída!", description: `Dados exportados com sucesso para ${filename}.csv.` });
  };

  const handleExportPDF = () => {
    toast({ title: "Funcionalidade em desenvolvimento", description: "A exportação para PDF será implementada em breve." });
  };

  if (summaryError || growthError || studentsPerPersonalError || plansDistributionError || recentSubsError || expiringSubsError || personalsWithoutPlanError) {
    return <div className="text-destructive">Erro ao carregar estatísticas: {summaryError?.message || growthError?.message || studentsPerPersonalError?.message || plansDistributionError?.message || recentSubsError?.message || expiringSubsError?.message || personalsWithoutPlanError?.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estatísticas da Plataforma</h1>
        <p className="text-muted-foreground">Visão aprofundada sobre o desempenho e crescimento da Atrenis.</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Personal Trainers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{summaryStats?.total_personals || 0}</div>}
            <p className="text-xs text-muted-foreground">personals cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{summaryStats?.total_alunos || 0}</div>}
            <p className="text-xs text-muted-foreground">alunos na plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal Recorrente (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(summaryStats?.mrr || 0)}</div>}
            <p className="text-xs text-muted-foreground">estimativa mensal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual Recorrente (ARR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(summaryStats?.arr || 0)}</div>}
            <p className="text-xs text-muted-foreground">estimativa anual</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Exportação */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2">
          <Select onValueChange={setPeriodFilter} value={periodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7_days">Últimos 7 dias</SelectItem>
              <SelectItem value="30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="90_days">Últimos 90 dias</SelectItem>
              <SelectItem value="12_months">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          {/* <Select onValueChange={setPlanFilter} value={planFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Planos</SelectItem>
              <SelectItem value="basic">Plano Básico</SelectItem>
              <SelectItem value="premium">Plano Premium</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Personal Trainers (Últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGrowth ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={personalsGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total_personals" stroke="#8884d8" activeDot={{ r: 8 }} name="Novos Personals" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPlansDistribution ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={plansDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_personals"
                    nameKey="plan_nome"
                    label={({ plan_nome, percent }) => `${plan_nome} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {plansDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} Personals`, props.payload.plan_nome]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Personal Trainers por Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStudentsPerPersonal ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentsPerPersonal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="personal_nome" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_alunos" fill="#82ca9d" name="Total de Alunos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabelas de Detalhes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRecentSubs ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentSubscriptions && recentSubscriptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personal</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubscriptions.map((sub) => (
                    <TableRow key={sub.personal_id}>
                      <TableCell>{sub.personal_nome}</TableCell>
                      <TableCell>{sub.plan_nome}</TableCell>
                      <TableCell>{format(new Date(sub.data_assinatura), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Badge
                          className={`
                            ${sub.status_assinatura === 'active' && 'bg-secondary-green text-white'}
                            ${sub.status_assinatura === 'vencida' && 'bg-secondary-red text-white'}
                            ${sub.status_assinatura === 'trial' && 'bg-secondary-blue text-white'}
                            ${sub.status_assinatura === 'cancelada' && 'bg-gray-400 text-white'}
                            ${sub.status_assinatura === 'pendente' && 'bg-gray-600 text-white'}
                          `}
                        >
                          {sub.status_assinatura.charAt(0).toUpperCase() + sub.status_assinatura.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center">Nenhuma assinatura recente.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinaturas Próximas do Vencimento (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingExpiringSubs ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : expiringSubscriptions && expiringSubscriptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personal</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringSubscriptions.map((sub) => (
                    <TableRow key={sub.personal_id}>
                      <TableCell>{sub.personal_nome}</TableCell>
                      <TableCell>{sub.plan_nome}</TableCell>
                      <TableCell>{format(new Date(sub.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Badge
                          className={`
                            ${sub.status_assinatura === 'active' && 'bg-secondary-green text-white'}
                            ${sub.status_assinatura === 'vencida' && 'bg-secondary-red text-white'}
                            ${sub.status_assinatura === 'trial' && 'bg-secondary-blue text-white'}
                            ${sub.status_assinatura === 'cancelada' && 'bg-gray-400 text-white'}
                            ${sub.status_assinatura === 'pendente' && 'bg-gray-600 text-white'}
                          `}
                        >
                          {sub.status_assinatura.charAt(0).toUpperCase() + sub.status_assinatura.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center">Nenhuma assinatura próxima do vencimento.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Trainers Sem Plano Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPersonalsWithoutPlan ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : personalsWithoutPlan && personalsWithoutPlan.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personal</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personalsWithoutPlan.map((personal) => (
                    <TableRow key={personal.personal_id}>
                      <TableCell>{personal.personal_nome}</TableCell>
                      <TableCell>{personal.email}</TableCell>
                      <TableCell>{format(new Date(personal.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/personal-trainers?search=${personal.personal_nome}`)}>
                          <UserX className="mr-2 h-4 w-4" /> Atribuir Plano
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center">Todos os personal trainers possuem um plano ativo.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}