import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Download, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AlunoProfile = Tables<'profiles'> & {
  personal: { nome: string } | null;
  treinos_ativos: { count: number }[];
};

type PersonalOption = {
  id: string;
  nome: string;
};

const SUBSCRIPTION_STATUS_OPTIONS: Enums<'subscription_status'>[] = [
  "active", "pending", "inactive", "trialing", "past_due", "canceled"
];

export default function Alunos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonal, setSelectedPersonal] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Enums<'subscription_status'> | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null); // To ensure only admin can access

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

  const { data: personalOptions, isLoading: isLoadingPersonals, error: personalError } = useQuery<PersonalOption[]>({
    queryKey: ["personalOptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('role', 'personal')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!adminId,
  });

  const { data: alunos, isLoading: isLoadingAlunos, error: alunosError } = useQuery<AlunoProfile[]>({
    queryKey: ["adminAlunos", searchTerm, selectedPersonal, selectedStatus],
    queryFn: async () => {
      if (!adminId) return [];

      let query = supabase
        .from('profiles')
        .select(`
          id,
          nome,
          email,
          created_at,
          subscription_status,
          personal:profiles!personal_id(nome),
          treinos_ativos:aluno_treinos!inner(count)
        `)
        .eq('role', 'aluno');

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (selectedPersonal) {
        query = query.eq('personal_id', selectedPersonal);
      }

      if (selectedStatus) {
        query = query.eq('subscription_status', selectedStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as AlunoProfile[];
    },
    enabled: !!adminId,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewDetails = (id: string) => {
    // Implement navigation to student detail page
    console.log("Ver detalhes do Aluno:", id);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `Detalhes para o Aluno ${id} serão implementados em breve.`,
    });
  };

  const handleExportCSV = () => {
    if (!alunos || alunos.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Nenhum dado de aluno para exportar.",
      });
      return;
    }

    const headers = ['Nome', 'Email', 'Personal Trainer', 'Treinos Ativos', 'Status Assinatura', 'Data de Cadastro'];
    const rows = alunos.map(aluno => [
      aluno.nome,
      aluno.email,
      aluno.personal?.nome || '-',
      aluno.treinos_ativos[0]?.count || 0,
      aluno.subscription_status || '-',
      new Date(aluno.created_at).toLocaleDateString('pt-BR')
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `atrenis_alunos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída!",
      description: "Dados dos alunos exportados com sucesso para CSV.",
    });
  };

  if (personalError) {
    return <div className="text-destructive">Erro ao carregar opções de personal trainers: {personalError.message}</div>;
  }
  if (alunosError) {
    return <div className="text-destructive">Erro ao carregar alunos: {alunosError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Todos os Alunos</h1>
          <p className="text-muted-foreground">Gerencie todos os alunos da plataforma</p>
        </div>
        <Button onClick={handleExportCSV} className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="relative col-span-full md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar aluno por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value) => setSelectedPersonal(value === "todos" ? null : value)} value={selectedPersonal || "todos"}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Filtrar por Personal Trainer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Personals</SelectItem>
            {isLoadingPersonals ? (
              <SelectItem value="loading" disabled>Carregando...</SelectItem>
            ) : (
              personalOptions?.map((personal) => (
                <SelectItem key={personal.id} value={personal.id}>{personal.nome}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setSelectedStatus(value === "todos" ? null : value as Enums<'subscription_status'>)} value={selectedStatus || "todos"}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoadingAlunos ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Aluno</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Personal Trainer</TableHead>
                <TableHead>Treinos Ativos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : alunos && alunos.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Aluno</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Personal Trainer</TableHead>
                <TableHead className="text-center">Treinos Ativos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary-yellow text-primary-dark">
                          {getInitials(aluno.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{aluno.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{aluno.email}</TableCell>
                  <TableCell>{aluno.personal?.nome || '-'}</TableCell>
                  <TableCell className="text-center">{aluno.treinos_ativos[0]?.count || 0}</TableCell>
                  <TableCell>{aluno.subscription_status ? (aluno.subscription_status.charAt(0).toUpperCase() + aluno.subscription_status.slice(1).replace('_', ' ')) : '-'}</TableCell>
                  <TableCell>
                    {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(aluno.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground text-center">Nenhum aluno encontrado.</p>
      )}
    </div>
  );
}