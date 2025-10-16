import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dumbbell, Eye, Edit, Ban, MoreHorizontal, CalendarDays, Target, Phone, History, ListChecks } from "lucide-react";
import { useAlunoUtils } from "@/hooks/useAlunoUtils";
import { AlunoWithTreinosCount } from "@/hooks/usePersonalStudents";

interface AlunoCardProps {
  aluno: AlunoWithTreinosCount;
  onViewDetails: (aluno: AlunoWithTreinosCount) => void;
  onEdit: (id: string) => void;
  onAssignWorkout: (aluno: AlunoWithTreinosCount) => void;
  onViewHistory: (id: string) => void;
  onDeactivate: (id: string) => void;
}

export default function AlunoCard({
  aluno,
  onViewDetails,
  onEdit,
  onAssignWorkout,
  onViewHistory,
  onDeactivate,
}: AlunoCardProps) {
  const { calculateAge, getInitials } = useAlunoUtils();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarFallback className="bg-primary-yellow text-primary-dark">
            {getInitials(aluno.nome)}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{aluno.nome}</CardTitle>
          <p className="text-sm text-muted-foreground">{aluno.email}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {aluno.telefone && (
          <p className="flex items-center gap-1">
            <Phone className="h-4 w-4 text-muted-foreground" /> {aluno.telefone}
          </p>
        )}
        {aluno.data_nascimento && (
          <p className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4 text-muted-foreground" /> {calculateAge(aluno.data_nascimento)} anos
          </p>
        )}
        {aluno.objetivo && (
          <p className="flex items-center gap-1">
            <Target className="h-4 w-4 text-muted-foreground" /> <Badge variant="secondary">{aluno.objetivo}</Badge>
          </p>
        )}
        <p className="flex items-center gap-1">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          {aluno.aluno_treinos[0]?.count || 0} Treinos Ativos
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails(aluno)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(aluno.id)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAssignWorkout(aluno)}>
              <ListChecks className="mr-2 h-4 w-4" /> Atribuir Treino
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewHistory(aluno.id)}>
              <History className="mr-2 h-4 w-4" /> Ver Histórico
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDeactivate(aluno.id)}>
              <Ban className="mr-2 h-4 w-4" /> Desativar Aluno
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}