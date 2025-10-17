import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePersonalAdminCrud } from '@/hooks/admin/usePersonalAdminCrud';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeactivatePersonalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personal: {
    id: string;
    nome: string;
    ativo: boolean;
  };
}

export function DeactivatePersonalDialog({ 
  open, 
  onOpenChange, 
  personal 
}: DeactivatePersonalDialogProps) {
  const { togglePersonalStatus } = usePersonalAdminCrud();
  const [motivo, setMotivo] = useState('');

  const handleSubmit = () => {
    togglePersonalStatus.mutate(
      {
        id: personal.id,
        ativo: !personal.ativo,
        motivo: motivo || undefined
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setMotivo('');
        }
      }
    );
  };

  const isDeactivating = personal.ativo;
  const isValid = !isDeactivating || motivo.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${isDeactivating ? 'text-destructive' : 'text-green-600'}`} />
            {isDeactivating ? 'Desativar' : 'Ativar'} Personal Trainer
          </DialogTitle>
          <DialogDescription>
            {isDeactivating 
              ? `Você está prestes a desativar ${personal.nome}. Esta ação impedirá o acesso do personal trainer à plataforma.`
              : `Você está prestes a reativar ${personal.nome}. O personal trainer terá acesso novamente à plataforma.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo {isDeactivating ? '(obrigatório)' : '(opcional)'}
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={isDeactivating 
                ? "Ex: Não pagamento, violação de termos, etc."
                : "Ex: Regularização de pagamento, etc."
              }
              rows={3}
              required={isDeactivating}
            />
            {isDeactivating && (
              <p className="text-xs text-muted-foreground">
                O motivo é obrigatório para desativação
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={togglePersonalStatus.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant={isDeactivating ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={togglePersonalStatus.isPending || !isValid}
          >
            {togglePersonalStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeactivating ? 'Desativar' : 'Ativar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
