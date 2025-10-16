import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Search, User, Dumbbell, Eye, Edit, Ban } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function Alunos() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [personalId, setPersonalId] = useState<string | null>(null);

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

  const { data: alunos, isLoading, error } = useQuery<AlunoWithTreinosCount[]>({
    queryKey: ["personalStudents", personalId, searchTerm],
    queryFn: async () => {
      if (!personalId) return [];

      let query = supabase
        .from("profiles")
        .select(`
          *,
          aluno_treinos(count)
        `)
        .eq("personal_id", personalId)
        .eq("role", "aluno");

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order("nome", { ascending: true });

      if (error) throw error;
      return data as AlunoWithTreinosCount[];
    },
    enabled: !!personalId,
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
    navigate(`/personal/alunos/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/personal/alunos/${id}/edit`);
  };

  const handleDeactivate = (id: string) => {
    // Lógica para desativar aluno
    console.log("Desativar aluno:", id);
  };

  if (error) {
    return <div className="text-destructive">Erro ao carregar alunos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Alunos</h1>
          <p className="text-muted-foreground">Gerencie seus alunos cadastrados</p>
        </div>
        <Link to="/personal/alunos/new"> {/* Atualizado para a nova rota */}
          <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Novo Aluno
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar aluno por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
      ) : alunos && alunos.length > 0 ? (
        isMobile ? (
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
                  {aluno.telefone && <p>Telefone: {aluno.telefone}</p>}
                  {aluno.data_nascimento && <p>Idade: {calculateAge(aluno.data_nascimento)} anos</p>}
                  {aluno.objetivo && <Badge variant="secondary">{aluno.objetivo}</Badge>}
                  <p className="flex items-center gap-1">
                    <Dumbbell className="h-4 w-4" />
                    {aluno.aluno_treinos[0]?.count || 0} Treinos Ativos
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button size="sm" onClick={() => handleViewDetails(aluno.id)}>
                    <Eye className="h-4 w-4 mr-1" /> Detalhes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(aluno.id)}>
                    <Edit className="h-4 w-4 mr-1" /> Editar
                  </Button>
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
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(aluno.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(aluno.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeactivate(aluno.id)}>
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <p className="text-muted-foreground text-center">Nenhum aluno encontrado.</p>
      )}
    </div>
  );
}