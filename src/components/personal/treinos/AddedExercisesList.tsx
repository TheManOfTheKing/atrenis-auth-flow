import { UseFormReturn } from 'react-hook-form';
import { WorkoutFormData } from '@/lib/validations';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableExerciseItem } from './SortableExerciseItem';

interface AddedExercisesListProps {
  exercicios: any[];
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdate: (index: number, updatedExercise: any) => void;
  form: UseFormReturn<WorkoutFormData>;
}

export function AddedExercisesList({
  exercicios,
  onRemove,
  onReorder,
  onUpdate,
  form
}: AddedExercisesListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = exercicios.findIndex((_, idx) => idx === active.id);
      const newIndex = exercicios.findIndex((_, idx) => idx === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  if (exercicios.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Exercícios Adicionados ({exercicios.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Arraste para reordenar
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={exercicios.map((_, idx) => idx)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {exercicios.map((exercicio, index) => (
              <SortableExerciseItem
                key={`${exercicio.exercicio_id}-${index}`}
                id={index}
                exercicio={exercicio}
                index={index}
                onRemove={() => onRemove(index)}
                onUpdate={(updatedExercise) => onUpdate(index, updatedExercise)}
                form={form}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
