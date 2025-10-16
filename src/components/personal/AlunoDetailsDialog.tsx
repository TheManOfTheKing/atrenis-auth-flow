import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, CalendarDays, Target, User, Dumbbell, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Profile = Tables<'profiles'>;
type AlunoWithTreinosCount = Profile & {
  aluno_treinos: { count: number }[];
};

interface AlunoDetailsDialogProps {
  aluno: AlunoWithTreinosCount;
  isOpen: boolean;
  onClose: () => void;
}

const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function AlunoDetailsDialog({ aluno, isOpen, onClose }: AlunoDetailsDialogProps) {
  if (!aluno) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarFallback className="bg-primary-yellow text-primary-dark text-3xl">
              {getInitials(aluno.nome)}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl">{aluno.nome}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Detalhes completos do aluno
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{aluno.email}</span>
          </div>
          {aluno.telefone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span>{aluno.telefone}</span>
            </div>
          )}
          {aluno.data_nascimento && (
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span>{calculateAge(aluno.data_nascimento)} anos ({format(new Date(aluno.data_nascimento), "PPP", { locale: ptBR })})</span>
            </div>
          )}
          {aluno.objetivo && (
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-muted-foreground" />
              <Badge variant="secondary">{aluno.objetivo}</Badge>
            </div>
          )}
          {aluno.observacoes_aluno && (
            <div className="grid gap-1">
              <span className="text-sm font-medium text-muted-foreground">Observações:</span>
              <p className="text-sm">{aluno.observacoes_aluno}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
            <span>{aluno.aluno_treinos[0]?.count || 0} Treinos Ativos</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span>Membro desde: {format(new Date(aluno.created_at), "PPP", { locale: ptBR })}</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}