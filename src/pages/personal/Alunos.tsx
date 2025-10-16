import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PlusCircle, Search, User, Dumbbell, Eye, Edit, Ban, MoreHorizontal, CalendarDays, Target, Phone, Mail, History, ListChecks } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AlunoDetailsDialog from "@/components/personal/AlunoDetailsDialog"; // Novo componente
import AssignWorkoutDialog from "@/components/personal/AssignWorkoutDialog"; // Novo componente

type Profile = Tables<'profiles'>;
type AlunoWithTreinosCount = Profile & {
  aluno_treinos: { count: number }[];
};

const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const ITEMS_PER_PAGE = 10;

export default function Alunos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("nome_asc"); // 'nome_asc', 'nome_desc', 'recentes', 'antigos'
  const [currentPage, setCurrentPage] = useState(1);
  const [personalId, setPersonalId] = useState<string | null>(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAlunoForDetails, setSelectedAlunoForDetails] = useState<AlunoWithTreinosCount | null>(null);

  const [isAssignWorkoutDialogOpen, setIsAssignWorkoutDialogOpen] = useState(false);
  const [selectedAlunoForWorkout, setSelectedAlunoForWorkout] = useState<AlunoWithTreinosCount | null>(null);

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
        setPersonalId(user.id);
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const { data, isLoading, error } = useQuery<{ alunos: AlunoWithTreinosCount[], count: number }>({
    queryKey: ["personalStudents", personalId, debouncedSearchTerm, sortOrder, currentPage],
    queryFn: async () => {
      if (!personalId) return { alunos: [], count: 0 };

      let query = supabase
        .from("profiles")
        .select(`
          *,
          aluno_treinos!aluno_treinos_aluno_id_fkey(count)
        `, { count: 'exact' })
        .eq("personal_id", personalId)
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
        default:
          query = query.order("nome", { ascending: true });
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: alunosData, count, error } = await query;

      if (error) throw error;
      return { alunos: alunosData as AlunoWithTreinosCount[], count: count || 0 };
    },
    enabled: !!personalId,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new
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

  const handleViewDetails = (aluno: AlunoWithTreinosCount) => {
    setSelectedAlunoForDetails(aluno);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    navigate(`/personal/alunos/${id}/edit`);
  };

  const handleAssignWorkout = (aluno: AlunoWithTreinosCount) => {
    setSelectedAlunoForWorkout(aluno);
    setIsAssignWorkoutDialogOpen(true);
  };

  const handleViewHistory = (id: string) => {
    navigate(`/personal/alunos/${id}/historico`);
  };

  const handleDeactivate = (id: string) => {
    toast({
      variant: "destructive",
      title: "Funcionalidade em desenvolvimento",
      description: "A desativação de alunos requer um campo de status na tabela de perfis. Por enquanto, esta ação não está disponível.",
    });
    // Implementação futura:
    // try {
    //   const { error } = await supabase
    //     .from("profiles")
    //     .update({ status: "inativo" }) // Exemplo: requer um campo 'status' na tabela profiles
    //     .eq("id", id);
    //   if (error) throw error;
    //   toast({ title: "Aluno desativado!", description: "O aluno foi marcado como inativo." });
    //   queryClient.invalidateQueries({ queryKey: ["personalStudents"] });
    // } catch (error: any) {
    //   toast({ variant: "destructive", title: "Erro ao desativar aluno", description: error.message });
    // }
  };

  if (error) {
    return <div className="text-destructive text-center p-8">Erro ao carregar alunos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Alunos</h1>
          <p className="text-muted-foreground">Gerencie seus alunos cadastrados</p>
        </div>
        <Link to="/personal/alunos/new">
          <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Novo Aluno
          </Button>
        </Link>
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
      </div>

      {isLoading && !data ? ( // Show skeleton only on initial load or when no previous data
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : alunos.length > 0 ? (
        <>
          {isMobile ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {alunos.map((aluno) => (
                <Card key={aluno.id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary-yellow text-primary-dark">
                        {getInitials(aluno.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{aluno.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">{aluno.email}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {aluno.telefone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" /> {aluno.telefone}
                      </p>
                    )}
                    {aluno.data_nascimento && (
                      <p className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" /> {calculateAge(aluno.data_nascimento)} anos
                      </p>
                    )}
                    {aluno.objetivo && (
                      <p className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-muted-foreground" /> <Badge variant="secondary">{aluno.objetivo}</Badge>
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      {aluno.aluno_treinos[0]?.count || 0} Treinos Ativos
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(aluno)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(aluno.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignWorkout(aluno)}>
                          <ListChecks className="mr-2 h-4 w-4" /> Atribuir Treino
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewHistory(aluno.id)}>
                          <History className="mr-2 h-4 w-4" /> Ver Histórico
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeactivate(aluno.id)}>
                          <Ban className="mr-2 h-4 w-4" /> Desativar Aluno
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Avatar</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead className="hidden lg:table-cell">Idade</TableHead>
                    <TableHead className="hidden lg:table-cell">Objetivo</TableHead>
                    <TableHead className="text-center">Treinos Ativos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarFallback className="bg-primary-yellow text-primary-dark">
                            {getInitials(aluno.nome)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{aluno.nome}</TableCell>
                      <TableCell>{aluno.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{aluno.telefone || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {aluno.data_nascimento ? `${calculateAge(aluno.data_nascimento)} anos` : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {aluno.objetivo ? <Badge variant="secondary">{aluno.objetivo}</Badge> : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {aluno.aluno_treinos[0]?.count || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(aluno)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(aluno.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignWorkout(aluno)}>
                              <ListChecks className="mr-2 h-4 w-4" /> Atribuir Treino
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewHistory(aluno.id)}>
                              <History className="mr-2 h-4 w-4" /> Ver Histórico
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeactivate(aluno.id)}>
                              <Ban className="mr-2 h-4 w-4" /> Desativar Aluno
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          <p className="text-sm text-muted-foreground text-center mt-4">
            Total de alunos: {totalAlunos}
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-24 w-24 text-muted-foreground mb-6" />
          <h3 className="text-2xl font-bold mb-2">Você ainda não tem alunos cadastrados</h3>
          <p className="text-muted-foreground mb-6">
            Comece a gerenciar seus clientes adicionando seu primeiro aluno.
          </p>
          <Link to="/personal/alunos/new">
            <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Primeiro Aluno
            </Button>
          </Link>
        </div>
      )}

      {selectedAlunoForDetails && (
        <AlunoDetailsDialog
          aluno={selectedAlunoForDetails}
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
        />
      )}

      {selectedAlunoForWorkout && (
        <AssignWorkoutDialog
          aluno={selectedAlunoForWorkout}
          isOpen={isAssignWorkoutDialogOpen}
          onClose={() => setIsAssignWorkoutDialogOpen(false)}
        />
      )}
    </div>
  );
}