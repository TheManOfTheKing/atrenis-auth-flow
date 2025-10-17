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
import { AlunoDetailsDialog } from "@/components/admin/alunos/AlunoDetailsDialog";
import { exportAlunosToCSV } from "@/utils/exportCSV";

type AlunoWithDetails = Tables<'profiles'> & {
  personal_nome: string;
  personal_email: string;
  treinos_count: number;
};

const ITEMS_PER_PAGE = 10;

export default function Alunos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("nome_asc"); // 'nome_asc', 'nome_desc', 'recentes', 'antigos'
  const [currentPage, setCurrentPage] = useState(1);
  const [adminId, setAdminId] = useState<string | null>(null); // To ensure only admin can access

  // Estados para o dialog de detalhes
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState<AlunoWithDetails | null>(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

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

  const { data, isLoading, error } = useQuery<{ alunos: AlunoWithDetails[], count: number }>({
    queryKey: ["adminAllStudents", debouncedSearchTerm, sortOrder, currentPage],
    queryFn: async () => {
      // Por enquanto, vamos usar uma query simples sem join
      let query = supabase
        .from("profiles")
        .select("*", { count: 'exact' })
        .eq("role", "aluno");

      if (debouncedSearchTerm) {
        query = query.or(`nome.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`);
      }

      switch (sortOrder) {
        case "nome_asc":
          query = query.order("nome", { ascending: true });
          break;
        case "nome_desc":
          query = query.order("nome", { ascending: false });
          break;
        case "recentes":
          query = query.order("created_at", { ascending: false });
          break;
        case "antigos":
          query = query.order("created_at", { ascending: true });
          break;
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: alunosData, count, error } = await query;
      if (error) throw error;

      // Buscar informações do personal para cada aluno
      const alunosComDetalhes = await Promise.all(
        (alunosData || []).map(async (aluno) => {
          const { data: personal } = await supabase
            .from("profiles")
            .select("nome, email")
            .eq("id", aluno.personal_id)
            .single();

          const { count: treinosCount } = await supabase
            .from("aluno_treinos")
            .select("*", { count: "exact", head: true })
            .eq("aluno_id", aluno.id);

          return {
            ...aluno,
            personal_nome: personal?.nome || "Sem Personal",
            personal_email: personal?.email || "",
            treinos_count: treinosCount || 0
          };
        })
      );

      return { alunos: alunosComDetalhes, count: count || 0 };
    },
    enabled: !!adminId, // Habilita a query apenas se adminId estiver definido
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const alunos = data?.alunos || [];
  const totalAlunos = data?.count || 0;
  const totalPages = Math.ceil(totalAlunos / ITEMS_PER_PAGE);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewDetails = (aluno: AlunoWithDetails) => {
    setSelectedAluno(aluno);
    setIsDetailsDialogOpen(true);
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

    exportAlunosToCSV(alunos);
    
    toast({
      title: "Exportação concluída!",
      description: "Dados dos alunos exportados com sucesso para CSV.",
    });
  };

  if (error) {
    return <div className="text-destructive">Erro ao carregar alunos: {error.message}</div>;
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
        <Select onValueChange={setSortOrder} value={sortOrder}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nome_asc">Nome (A-Z)</SelectItem>
            <SelectItem value="nome_desc">Nome (Z-A)</SelectItem>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="antigos">Mais antigos</SelectItem>
          </SelectContent>
        </Select>
        {/* Removido o filtro de status de assinatura por enquanto */}
      </div>

      {isLoading && !data ? (
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
                  <TableCell>{aluno.personal_nome || '-'}</TableCell>
                  <TableCell className="text-center">{aluno.treinos_count || 0}</TableCell>
                  <TableCell>{aluno.subscription_status ? (aluno.subscription_status.charAt(0).toUpperCase() + aluno.subscription_status.slice(1).replace('_', ' ')) : '-'}</TableCell>
                  <TableCell>
                    {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(aluno)}
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
      <p className="text-sm text-muted-foreground text-center mt-4">
        Total de alunos: {totalAlunos}
      </p>

      {/* Dialog de Detalhes */}
      {selectedAluno && (
        <AlunoDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          aluno={selectedAluno}
        />
      )}
    </div>
  );
}