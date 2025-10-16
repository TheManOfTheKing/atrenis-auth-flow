import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { Loader2, Dumbbell, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = Tables<'profiles'>;
type AlunoWithTreinosCount = Profile & {
  aluno_treinos: { count: number }[];
};
type Treino = Tables<'treinos'>;

interface AssignWorkoutDialogProps {
  aluno: AlunoWithTreinosCount;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignWorkoutDialog({ aluno, isOpen, onClose }: AssignWorkoutDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTreinoId, setSelectedTreinoId] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const { data: personalWorkouts, isLoading: isLoadingWorkouts, error: workoutsError } = useQuery<Treino[]>({
    queryKey: ["personalWorkoutsForAssignment", aluno.personal_id],
    queryFn: async () => {
      if (!aluno.personal_id) return [];
      const { data, error } = await supabase
        .from('treinos')
        .select('*')
        .eq('personal_id', aluno.personal_id)
        .eq('ativo', true) // Apenas treinos ativos
        .order('nome', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!aluno.personal_id,
  });

  const assignWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTreinoId) throw new Error("Selecione um treino para atribuir.");
      if (!aluno.personal_id) throw new Error("ID do personal não encontrado.");

      const { error } = await supabase
        .from('aluno_treinos')
        .insert({
          aluno_id: aluno.id,
          treino_id: selectedTreinoId,
          personal_id: aluno.personal_id,
          observacoes: observacoes || null,
          status: 'ativo',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Treino atribuído!",
        description: `O treino foi atribuído a ${aluno.nome} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["personalStudents"] }); // Atualiza a lista de alunos
      queryClient.invalidateQueries({ queryKey: ["alunoActiveWorkouts", aluno.id] }); // Atualiza o dashboard do aluno
      onClose();
      setSelectedTreinoId(null);
      setObservacoes("");
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Erro ao atribuir treino",
        description: err.message,
      });
    },
  });

  const handleAssign = () => {
    assignWorkoutMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atribuir Treino a {aluno.nome}</DialogTitle>
          <DialogDescription>
            Selecione um treino da sua biblioteca para atribuir a este aluno.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{aluno.nome}</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="treino-select">Treino</Label>
            <Select onValueChange={setSelectedTreinoId} value={selectedTreinoId || ""} disabled={isLoadingWorkouts || assignWorkoutMutation.isPending}>
              <SelectTrigger id="treino-select">
                <SelectValue placeholder="Selecione um treino" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingWorkouts ? (
                  <SelectItem value="loading" disabled>Carregando treinos...</SelectItem>
                ) : workoutsError ? (
                  <SelectItem value="error" disabled>Erro ao carregar treinos</SelectItem>
                ) : personalWorkouts && personalWorkouts.length > 0 ? (
                  personalWorkouts.map((treino) => (
                    <SelectItem key={treino.id} value={treino.id}>
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" /> {treino.nome} ({treino.tipo})
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-workouts" disabled>Nenhum treino ativo disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações específicas para este aluno e treino..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={assignWorkoutMutation.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={assignWorkoutMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTreinoId || assignWorkoutMutation.isPending}
            className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90"
          >
            {assignWorkoutMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atribuindo...
              </>
            ) : (
              "Atribuir Treino"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}