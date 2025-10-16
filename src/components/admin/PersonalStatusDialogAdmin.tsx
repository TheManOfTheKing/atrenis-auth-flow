import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTogglePersonalStatusAdmin } from "@/hooks/usePersonalAdminCrud";
import { PersonalTrainerAdminView } from "@/hooks/useAdminPersonalTrainers";

interface PersonalStatusDialogAdminProps {
  isOpen: boolean;
  onClose: () => void;
  personal: PersonalTrainerAdminView | null;
  actionType: 'deactivate' | 'reactivate';
}

export default function PersonalStatusDialogAdmin({ isOpen, onClose, personal, actionType }: PersonalStatusDialogAdminProps) {
  const [motivo, setMotivo] = useState("");
  const togglePersonalStatusMutation = useTogglePersonalStatusAdmin();

  const isDeactivate = actionType === 'deactivate';

  const handleConfirm = () => {
    if (!personal) return;
    togglePersonalStatusMutation.mutate({
      personalId: personal.id,
      ativo: !isDeactivate,
      motivo: isDeactivate ? motivo : undefined,
    }, {
      onSuccess: () => {
        onClose();
        setMotivo("");
      },
    });
  };

  if (!personal) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDeactivate ? `Desativar Personal Trainer: ${personal.nome}` : `Reativar Personal Trainer: ${personal.nome}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeactivate
              ? "Ao desativar este personal trainer, ele não poderá mais fazer login na plataforma. Todos os seus alunos também serão desativados. Seus dados serão mantidos e você poderá reativá-lo a qualquer momento."
              : "Ao reativar este personal trainer, ele poderá fazer login novamente na plataforma. Seus alunos desativados *não* serão reativados automaticamente."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isDeactivate && (
          <div className="grid gap-2">
            <Label htmlFor="motivo_desativacao">Motivo da desativação (opcional)</Label>
            <Textarea
              id="motivo_desativacao"
              placeholder="Ex: Inatividade, pedido do personal, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={togglePersonalStatusMutation.isPending}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={togglePersonalStatusMutation.isPending}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={isDeactivate ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={togglePersonalStatusMutation.isPending}
            >
              {togglePersonalStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isDeactivate ? "Desativando..." : "Reativando..."}
                </>
              ) : (
                isDeactivate ? "Confirmar Desativação" : "Confirmar Reativação"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}