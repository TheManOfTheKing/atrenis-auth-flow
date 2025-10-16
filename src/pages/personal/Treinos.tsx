import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Search, Dumbbell, Users, Eye, Copy, Edit, Power } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Treino = Tables<'treinos'> & {
  treino_exercicios: { count: number }[];
  aluno_treinos: { count: number }[];
};

const WORKOUT_TYPES = [
  "A", "B", "C", "D", "E", "F", "Cardio", "Funcional", "Personalizado", "Outro"
];

export default function Treinos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
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

  const { data: treinos, isLoading, error } = useQuery<Treino[]>({
    queryKey: ["personalWorkouts", personalId, searchTerm, workoutType, showActiveOnly],
    queryFn: async () => {
      if (!personalId) return [];

      let query = supabase
        .from("treinos")
        .select(`
          *,
          treino_exercicios(count),
          aluno_treinos(count)
        `)
        .eq("personal_id", personalId);

      if (searchTerm) {
        query = query.ilike("nome", `%${searchTerm}%`);
      }

      if (workoutType) {
        query = query.eq("tipo", workoutType);
      }

      if (showActiveOnly) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as Treino[];
    },
    enabled: !!personalId,
  });

  const duplicateWorkoutMutation = useMutation({
    mutationFn: async (treinoId: string) => {
      const { data: treinoOriginal, error: treinoError } = await supabase
        .from('treinos')
        .select('*, treino_exercicios(*)')
        .eq('id', treinoId)
        .single();

      if (treinoError) throw treinoError;
      if (!treinoOriginal) throw new Error("Treino original não encontrado.");

      const { data: novoTreino, error: novoError } = await supabase
        .from('treinos')
        .insert({
          nome: `${treinoOriginal.nome} (Cópia)`,
          descricao: treinoOriginal.descricao,
          tipo: treinoOriginal.tipo,
          duracao_estimada_min: treinoOriginal.duracao_estimada_min,
          personal_id: personalId!,
          ativo: true, // Nova cópia é ativa por padrão
        })
        .select()
        .single();

      if (novoError) throw novoError;

      if (treinoOriginal.treino_exercicios && treinoOriginal.treino_exercicios.length > 0) {
        const exerciciosParaCopiar = treinoOriginal.treino_exercicios.map(ex => ({
          treino_id: novoTreino.id,
          exercicio_id: ex.exercicio_id,
          ordem: ex.ordem,
          series: ex.series,
          repeticoes: ex.repeticoes,
          carga: ex.carga,
          descanso_seg: ex.descanso_seg,
          observacoes: ex.observacoes,
        }));
        const { error: insertExercisesError } = await supabase.from('treino_exercicios').insert(exerciciosParaCopiar);
        if (insertExercisesError) throw insertExercisesError;
      }
      return novoTreino;
    },
    onSuccess: () => {
      toast({ title: "Treino duplicado!", description: "Uma cópia do treino foi criada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["personalWorkouts"] });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao duplicar treino", description: err.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ treinoId, currentStatus }: { treinoId: string; currentStatus: boolean }) => {
      const { error } = await supabase
        .from('treinos')
        .update({ ativo: !currentStatus })
        .eq('id', treinoId);
      if (error) throw error;
      return !currentStatus;
    },
    onSuccess: (newStatus) => {
      toast({ title: newStatus ? "Treino ativado!" : "Treino desativado!", description: `O treino foi ${newStatus ? 'ativado' : 'desativado'} com sucesso.` });
      queryClient.invalidateQueries({ queryKey: ["personalWorkouts"] });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Erro ao alterar status do treino", description: err.message });
    },
  });

  const handleDuplicate = (treinoId: string) => {
    duplicateWorkoutMutation.mutate(treinoId);
  };

  const handleToggleAtivo = (treinoId: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ treinoId, currentStatus });
  };

  const handleViewDetails = (id: string) => {
    navigate(`/personal/treinos/${id}`); // Rota para detalhes do treino (a ser criada)
  };

  const handleEdit = (id: string) => {
    navigate(`/personal/treinos/${id}/edit`); // Rota para edição do treino (a ser criada)
  };

  if (error) {
    return <div className="text-destructive">Erro ao carregar treinos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Treinos</h1>
          <p className="text-muted-foreground">Gerencie seus modelos de treino e atribuições</p>
        </div>
        <Link to="/personal/treinos/new"> {/* Rota para criar novo treino (a ser criada) */}
          <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Treino
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="relative col-span-full md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar treino por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value) => setWorkoutType(value === "todos" ? null : value)} value={workoutType || "todos"}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            {WORKOUT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2 col-span-full md:col-span-1 lg:col-span-2 justify-end">
          <Switch
            id="show-active"
            checked={showActiveOnly}
            onCheckedChange={setShowActiveOnly}
          />
          <Label htmlFor="show-active">{showActiveOnly ? "Apenas Ativos" : "Todos os Treinos"}</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : treinos && treinos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {treinos.map((treino) => (
            <Card key={treino.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{treino.nome}</CardTitle>
                  <Badge variant="secondary">{treino.tipo}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{treino.descricao || "Sem descrição."}</p>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span>{treino.treino_exercicios[0]?.count || 0} exercícios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{treino.aluno_treinos[0]?.count || 0} alunos atribuídos</span>
                </div>
                {treino.duracao_estimada_min && (
                  <div className="flex items-center gap-2">
                    <Power className="h-4 w-4 text-muted-foreground" />
                    <span>{treino.duracao_estimada_min} min (estimado)</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleViewDetails(treino.id)}>
                  <Eye className="h-4 w-4 mr-1" /> Detalhes
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicate(treino.id)} disabled={duplicateWorkoutMutation.isPending}>
                  <Copy className="h-4 w-4 mr-1" /> Duplicar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(treino.id)}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant={treino.ativo ? 'destructive' : 'default'}
                  onClick={() => handleToggleAtivo(treino.id, treino.ativo || false)}
                  disabled={toggleActiveMutation.isPending}
                >
                  <Power className="h-4 w-4 mr-1" /> {treino.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center">Nenhum treino encontrado com os filtros aplicados.</p>
      )}
    </div>
  );
}