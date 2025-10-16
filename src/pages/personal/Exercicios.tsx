import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { PlusCircle, Search, Dumbbell, Video, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Exercicio = Tables<'exercicios'>;

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas",
  "Glúteos", "Abdômen", "Cardio", "Funcional", "Outro"
];

export default function Exercicios() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [grupoMuscular, setGrupoMuscular] = useState<string | null>(null);
  const [apenasMeusExercicios, setApenasMeusExercicios] = useState(false);
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

  const { data: exercicios, isLoading, error, refetch } = useQuery<Exercicio[]>({
    queryKey: ["exercicios", personalId, searchTerm, grupoMuscular, apenasMeusExercicios],
    queryFn: async () => {
      if (!personalId) return [];

      let query = supabase
        .from("exercicios")
        .select("*");

      if (apenasMeusExercicios) {
        query = query.eq("criado_por_personal_id", personalId);
      } else {
        query = query.or(`criado_por_personal_id.is.null,criado_por_personal_id.eq.${personalId}`);
      }

      if (searchTerm) {
        query = query.ilike("nome", `%${searchTerm}%`);
      }

      if (grupoMuscular) {
        query = query.eq("grupo_muscular", grupoMuscular);
      }

      const { data, error } = await query.order("nome", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!personalId,
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
    cacheTime: 15 * 60 * 1000, // Manter no cache por 15 minutos
  });

  const handleEdit = (id: string) => {
    navigate(`/personal/exercicios/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este exercício?")) {
      return;
    }
    try {
      const { error } = await supabase
        .from("exercicios")
        .delete()
        .eq("id", id)
        .eq("criado_por_personal_id", personalId); // Garante que só pode excluir os próprios

      if (error) throw error;

      toast({
        title: "Exercício excluído!",
        description: "O exercício foi removido da sua biblioteca.",
      });
      refetch(); // Atualiza a lista de exercícios
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir exercício",
        description: error.message,
      });
    }
  };

  if (error) {
    return <div className="text-destructive">Erro ao carregar exercícios: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Exercícios</h1>
          <p className="text-muted-foreground">Gerencie seus exercícios e os da biblioteca padrão</p>
        </div>
        <Link to="/personal/exercicios/new">
          <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Exercício
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="relative col-span-full md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar exercício por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value) => setGrupoMuscular(value === "todos" ? null : value)} value={grupoMuscular || "todos"}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Filtrar por grupo muscular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Grupos</SelectItem>
            {MUSCLE_GROUPS.map((grupo) => (
              <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2 col-span-full md:col-span-1 lg:col-span-2 justify-end">
          <Switch
            id="apenas-meus"
            checked={apenasMeusExercicios}
            onCheckedChange={setApenasMeusExercicios}
          />
          <Label htmlFor="apenas-meus">Apenas meus exercícios</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : exercicios && exercicios.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {exercicios.map((exercicio) => (
            <Card key={exercicio.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg">{exercicio.nome}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  {exercicio.grupo_muscular && <Badge variant="secondary">{exercicio.grupo_muscular}</Badge>}
                  {exercicio.criado_por_personal_id && <Badge className="bg-secondary-blue text-white">Customizado</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{exercicio.descricao || "Sem descrição."}</p>
                {exercicio.video_url && (
                  <Button variant="link" className="px-0 mt-2" onClick={() => window.open(exercicio.video_url, "_blank")}>
                    <Video className="h-4 w-4 mr-1" /> Ver Vídeo
                  </Button>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                {exercicio.criado_por_personal_id === personalId && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(exercicio.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(exercicio.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center">Nenhum exercício encontrado com os filtros aplicados.</p>
      )}
    </div>
  );
}