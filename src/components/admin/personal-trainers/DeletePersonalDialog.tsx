import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePersonalAdminCrud } from '@/hooks/admin/usePersonalAdminCrud';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeletePersonalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personal: {
    id: string;
    nome: string;
  };
}

export function DeletePersonalDialog({ 
  open, 
  onOpenChange, 
  personal 
}: DeletePersonalDialogProps) {
  const { deletePersonal } = usePersonalAdminCrud();

  const handleDelete = () => {
    deletePersonal.mutate(personal.id, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Deletar Personal Trainer
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              Você está prestes a deletar permanentemente <strong>{personal.nome}</strong>.
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm font-medium text-destructive">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Serão removidos:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Todos os dados pessoais do personal trainer</li>
                <li>Treinos criados pelo personal</li>
                <li>Exercícios customizados</li>
                <li>Histórico de atividades</li>
                <li>Relacionamentos com alunos</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deletePersonal.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePersonal.isPending}
          >
            {deletePersonal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, Deletar Permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
