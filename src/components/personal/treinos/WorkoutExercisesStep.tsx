import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { WorkoutFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { ExerciseSearchDialog } from './ExerciseSearchDialog';
import { AddedExercisesList } from './AddedExercisesList';

interface WorkoutExercisesStepProps {
  form: UseFormReturn<WorkoutFormData>;
}

export function WorkoutExercisesStep({ form }: WorkoutExercisesStepProps) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const exercicios = form.watch('exercicios') || [];

  const handleAddExercise = (exercicioId: string, exercicioData: any) => {
    const currentExercicios = form.getValues('exercicios') || [];
    const nextOrdem = currentExercicios.length + 1;
    
    form.setValue('exercicios', [
      ...currentExercicios,
      {
        exercicio_id: exercicioId,
        ordem: nextOrdem,
        series: '3',
        repeticoes: '10',
        carga: '',
        descanso_seg: 60,
        observacoes: ''
      }
    ]);
    
    setIsSearchDialogOpen(false);
  };

  const handleRemoveExercise = (index: number) => {
    const currentExercicios = form.getValues('exercicios') || [];
    const updated = currentExercicios.filter((_, i) => i !== index);
    
    // Reordenar após remoção
    const reordered = updated.map((ex, idx) => ({
      ...ex,
      ordem: idx + 1
    }));
    
    form.setValue('exercicios', reordered);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const currentExercicios = [...(form.getValues('exercicios') || [])];
    const [moved] = currentExercicios.splice(fromIndex, 1);
    currentExercicios.splice(toIndex, 0, moved);
    
    // Atualizar ordem
    const reordered = currentExercicios.map((ex, idx) => ({
      ...ex,
      ordem: idx + 1
    }));
    
    form.setValue('exercicios', reordered);
  };

  const handleUpdateExercise = (index: number, updatedExercise: any) => {
    const currentExercicios = form.getValues('exercicios') || [];
    const updated = [...currentExercicios];
    updated[index] = { ...updated[index], ...updatedExercise };
    form.setValue('exercicios', updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exercícios do Treino</CardTitle>
          <CardDescription>
            Adicione exercícios e configure séries, repetições e carga para cada um.
            Você pode reordenar os exercícios arrastando-os.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercicios.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum exercício adicionado</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando exercícios ao seu treino
              </p>
              <Button onClick={() => setIsSearchDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Exercício
              </Button>
            </div>
          ) : (
            <>
              <AddedExercisesList
                exercicios={exercicios}
                onRemove={handleRemoveExercise}
                onReorder={handleReorder}
                onUpdate={handleUpdateExercise}
                form={form}
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSearchDialogOpen(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Mais Exercícios
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ExerciseSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onSelectExercise={handleAddExercise}
      />
    </div>
  );
}
