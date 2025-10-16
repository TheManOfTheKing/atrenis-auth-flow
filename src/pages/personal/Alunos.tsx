import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Componentes e Hooks Modulares
import { usePersonalStudents, AlunoWithTreinosCount } from "@/hooks/usePersonalStudents";
import AlunosFilterBar from "@/components/personal/AlunosFilterBar";
import AlunoCard from "@/components/personal/AlunoCard";
import AlunoTableRow from "@/components/personal/AlunoTableRow";
import AlunosPagination from "@/components/personal/AlunosPagination";
import AlunosEmptyState from "@/components/personal/AlunosEmptyState";
import AlunoDetailsDialog from "@/components/personal/AlunoDetailsDialog";
import AssignWorkoutDialog from "@/components/personal/AssignWorkoutDialog";

const ITEMS_PER_PAGE = 10; // Mantido aqui para referência, mas gerenciado no hook

export default function Alunos() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [personalId, setPersonalId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAlunoForDetails, setSelectedAlunoForDetails] = useState<AlunoWithTreinosCount | null>(null);
  const [isAssignWorkoutDialogOpen, setIsAssignWorkoutDialogOpen] = useState(false);
  const [selectedAlunoForWorkout, setSelectedAlunoForWorkout] = useState<AlunoWithTreinosCount | null>(null);

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

  const {
    alunos,
    totalAlunos,
    totalPages,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
  } = usePersonalStudents(personalId);

  const handleViewDetails = (aluno: AlunoWithTre treinoCount) => {
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
    console.error("Erro detalhado ao carregar alunos:", {
      error,
      personalId,
      searchTerm,
      sortOrder,
      currentPage
    });
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-destructive text-xl font-semibold">
          Erro ao carregar alunos
        </div>
        <div className="text-muted-foreground text-center max-w-md">
          {error.message || "Ocorreu um erro desconhecido"}
        </div>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!personalId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-lg">
          Carregando informações do usuário...
        </div>
      </div>
    );
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

      <AlunosFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[125px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : alunos.length > 0 ? (
        <>
          {isMobile ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {alunos.map((aluno) => (
                <AlunoCard
                  key={aluno.id}
                  aluno={aluno}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onAssignWorkout={handleAssignWorkout}
                  onViewHistory={handleViewHistory}
                  onDeactivate={handleDeactivate}
                />
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
                    <AlunoTableRow
                      key={aluno.id}
                      aluno={aluno}
                      onViewDetails={handleViewDetails}
                      onEdit={handleEdit}
                      onAssignWorkout={handleAssignWorkout}
                      onViewHistory={handleViewHistory}
                      onDeactivate={handleDeactivate}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <AlunosPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
          <p className="text-sm text-muted-foreground text-center mt-4">
            Total de alunos: {totalAlunos}
          </p>
        </>
      ) : (
        <AlunosEmptyState />
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