import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ExerciseConfigDialog } from './ExerciseConfigDialog';
import { UseFormReturn } from 'react-hook-form';
import { WorkoutFormData } from '@/lib/validations';
import { useExerciseById } from '@/hooks/personal/useExercises';

interface SortableExerciseItemProps {
  id: number;
  exercicio: any;
  index: number;
  onRemove: () => void;
  onUpdate: (updatedExercise: any) => void;
  form: UseFormReturn<WorkoutFormData>;
}

export function SortableExerciseItem({
  id,
  exercicio,
  index,
  onRemove,
  onUpdate,
  form
}: SortableExerciseItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Buscar detalhes do exercício
  const { data: exercicioDetalhes, isLoading } = useExerciseById(exercicio.exercicio_id);

  const handleConfigUpdate = (updatedConfig: any) => {
    onUpdate(updatedConfig);
    setIsEditDialogOpen(false);
  };

  return (
    <>
      <Card 
        ref={setNodeRef} 
        style={style} 
        className={`p-4 transition-all ${isDragging ? 'shadow-lg' : 'hover:shadow-md'}`}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 hover:bg-muted rounded p-1 transition-colors"
            title="Arrastar para reordenar"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Ordem */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
            {exercicio.ordem}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <h4 className="font-medium truncate">
                  {exercicioDetalhes?.nome || 'Carregando...'}
                </h4>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {exercicioDetalhes?.grupo_muscular && (
                    <Badge variant="secondary" className="text-xs">
                      {exercicioDetalhes.grupo_muscular}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {exercicio.series} séries × {exercicio.repeticoes} reps
                  </Badge>
                  {exercicio.carga && (
                    <Badge variant="outline" className="text-xs">
                      {exercicio.carga}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {exercicio.descanso_seg}s descanso
                  </Badge>
                </div>
                {exercicio.observacoes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    💡 {exercicio.observacoes}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-1 shrink-0">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setIsEditDialogOpen(true)}
              title="Editar configuração"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onRemove}
              title="Remover exercício"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <ExerciseConfigDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        exercicio={exercicio}
        exercicioDetalhes={exercicioDetalhes}
        onSave={handleConfigUpdate}
      />
    </>
  );
}
