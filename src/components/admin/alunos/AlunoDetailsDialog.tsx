import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Calendar, Target, Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlunoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    data_nascimento?: string;
    objetivo?: string;
    personal_nome?: string;
    treinos_count?: number;
    created_at: string;
    ativo: boolean;
    nivel_experiencia?: string;
    restricoes_medicas?: string;
  };
}

export function AlunoDetailsDialog({ open, onOpenChange, aluno }: AlunoDetailsDialogProps) {
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Aluno
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{aluno.nome}</span>
                <Badge variant={aluno.ativo ? 'default' : 'destructive'}>
                  {aluno.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{aluno.email}</span>
              </div>

              {aluno.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{aluno.telefone}</span>
                </div>
              )}

              {aluno.data_nascimento && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(aluno.data_nascimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} 
                    ({calculateAge(aluno.data_nascimento)} anos)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Trainer */}
          {aluno.personal_nome && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Trainer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{aluno.personal_nome}</p>
              </CardContent>
            </Card>
          )}

          {/* Objetivo */}
          {aluno.objetivo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Objetivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{aluno.objetivo}</p>
              </CardContent>
            </Card>
          )}

          {/* Nível de Experiência */}
          {aluno.nivel_experiencia && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nível de Experiência</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{aluno.nivel_experiencia}</Badge>
              </CardContent>
            </Card>
          )}

          {/* Restrições Médicas */}
          {aluno.restricoes_medicas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Restrições Médicas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{aluno.restricoes_medicas}</p>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Treinos Ativos:</span>
                <span className="font-medium">{aluno.treinos_count || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cadastro:</span>
                <span className="font-medium">
                  {format(new Date(aluno.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tempo na plataforma:</span>
                <span className="font-medium">
                  {Math.floor((new Date().getTime() - new Date(aluno.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
