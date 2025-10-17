import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePersonalAdminCrud } from '@/hooks/admin/usePersonalAdminCrud';
import { Loader2 } from 'lucide-react';

interface EditPersonalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personal: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    cref?: string;
  };
}

export function EditPersonalDialog({ open, onOpenChange, personal }: EditPersonalDialogProps) {
  const { updatePersonal } = usePersonalAdminCrud();
  const [formData, setFormData] = useState({
    nome: personal.nome,
    email: personal.email,
    telefone: personal.telefone || '',
    cref: personal.cref || ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        nome: personal.nome,
        email: personal.email,
        telefone: personal.telefone || '',
        cref: personal.cref || ''
      });
    }
  }, [open, personal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePersonal.mutate(
      {
        id: personal.id,
        ...formData
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        }
      }
    );
  };

  const isValid = formData.nome.trim() && formData.email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Personal Trainer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              placeholder="Nome completo do personal trainer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cref">CREF</Label>
            <Input
              id="cref"
              value={formData.cref}
              onChange={(e) => setFormData({ ...formData, cref: e.target.value })}
              placeholder="000000-G/UF"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updatePersonal.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updatePersonal.isPending || !isValid}>
              {updatePersonal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
