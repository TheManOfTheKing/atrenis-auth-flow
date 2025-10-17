import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Dumbbell } from 'lucide-react';
import { useExercises } from '@/hooks/personal/useExercises';
import { CreateExerciseDialog } from './CreateExerciseDialog';

interface ExerciseSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (exercicioId: string, exercicioData: any) => void;
}

export function ExerciseSearchDialog({
  open,
  onOpenChange,
  onSelectExercise
}: ExerciseSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: exercicios, isLoading, error } = useExercises(searchTerm);

  const handleSelect = (exercicio: any) => {
    onSelectExercise(exercicio.id, exercicio);
  };

  const handleCreateSuccess = (newExercicio: any) => {
    setIsCreateDialogOpen(false);
    handleSelect(newExercicio);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Buscar Exercícios
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Barra de busca */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou grupo muscular..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Novo
              </Button>
            </div>

            {/* Lista de exercícios */}
            <ScrollArea className="h-[500px] pr-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  <p className="font-medium">Erro ao carregar exercícios</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error.message || 'Tente novamente em alguns instantes'}
                  </p>
                </div>
              ) : exercicios && exercicios.length > 0 ? (
                <div className="space-y-2">
                  {exercicios.map((exercicio) => (
                    <div
                      key={exercicio.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                      onClick={() => handleSelect(exercicio)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-primary transition-colors">
                          {exercicio.nome}
                        </h4>
                        {exercicio.descricao && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {exercicio.descricao}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {exercicio.grupo_muscular && (
                            <Badge variant="secondary" className="text-xs">
                              {exercicio.grupo_muscular}
                            </Badge>
                          )}
                          {exercicio.equipamento && (
                            <Badge variant="outline" className="text-xs">
                              {exercicio.equipamento}
                            </Badge>
                          )}
                          {exercicio.dificuldade && (
                            <Badge variant="outline" className="text-xs">
                              {exercicio.dificuldade}
                            </Badge>
                          )}
                          {exercicio.publico && (
                            <Badge variant="default" className="text-xs">
                              Público
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum exercício encontrado</p>
                  <p className="text-sm mt-1">
                    {searchTerm 
                      ? 'Tente buscar com outros termos ou crie um novo exercício'
                      : 'Crie seu primeiro exercício personalizado'
                    }
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <CreateExerciseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
