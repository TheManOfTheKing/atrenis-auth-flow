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
import { useToggleAlunoStatus } from "@/hooks/useToggleAlunoStatus";
import { AlunoWithTreinosCount } from "@/hooks/usePersonalStudents";

interface AlunoStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: AlunoWithTreinosCount | null;
  actionType: 'deactivate' | 'reactivate';
}

export default function AlunoStatusDialog({ isOpen, onClose, aluno, actionType }: AlunoStatusDialogProps) {
  const [motivo, setMotivo] = useState("");
  const toggleAlunoStatusMutation = useToggleAlunoStatus();

  const isDeactivate = actionType === 'deactivate';

  const handleConfirm = () => {
    if (!aluno) return;
    toggleAlunoStatusMutation.mutate({
      alunoId: aluno.id,
      ativo: !isDeactivate, // Se for desativar, ativo = false; se for reativar, ativo = true
      motivo: isDeactivate ? motivo : undefined, // Motivo apenas para desativação
    }, {
      onSuccess: () => {
        onClose();
        setMotivo(""); // Limpa o motivo após o sucesso
      },
    });
  };

  if (!aluno) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDeactivate ? `Desativar Aluno: ${aluno.nome}` : `Reativar Aluno: ${aluno.nome}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeactivate
              ? "Ao desativar este aluno, ele não poderá mais fazer login na plataforma. Seus dados serão mantidos e você poderá reativá-lo a qualquer momento."
              : "Ao reativar este aluno, ele poderá fazer login novamente na plataforma e acessar seus treinos e informações."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isDeactivate && (
          <div className="grid gap-2">
            <Label htmlFor="motivo_desativacao">Motivo da desativação (opcional)</Label>
            <Textarea
              id="motivo_desativacao"
              placeholder="Ex: Pedido do aluno, inatividade, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={toggleAlunoStatusMutation.isPending}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={toggleAlunoStatusMutation.isPending}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={isDeactivate ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={toggleAlunoStatusMutation.isPending}
            >
              {toggleAlunoStatusMutation.isPending ? (
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