import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
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
import { Dumbbell, Eye, Edit, Ban, MoreHorizontal, History, ListChecks } from "lucide-react";
import { useAlunoUtils } from "@/hooks/useAlunoUtils";
import { AlunoWithTreinosCount } from "@/hooks/usePersonalStudents";

interface AlunoTableRowProps {
  aluno: AlunoWithTreinosCount;
  onViewDetails: (aluno: AlunoWithTreinosCount) => void;
  onEdit: (id: string) => void;
  onAssignWorkout: (aluno: AlunoWithTreinosCount) => void;
  onViewHistory: (id: string) => void;
  onDeactivate: (id: string) => void;
}

export default function AlunoTableRow({
  aluno,
  onViewDetails,
  onEdit,
  onAssignWorkout,
  onViewHistory,
  onDeactivate,
}: AlunoTableRowProps) {
  const { calculateAge, getInitials } = useAlunoUtils();

  return (
    <TableRow key={aluno.id}>
      <TableCell>
        <Avatar>
          <AvatarFallback className="bg-primary-yellow text-primary-dark">
            {getInitials(aluno.nome)}
          </AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell className="font-medium">{aluno.nome}</TableCell>
      <TableCell>{aluno.email}</TableCell>
      <TableCell className="hidden md:table-cell">{aluno.telefone || "-"}</TableCell>
      <TableCell className="hidden lg:table-cell">
        {aluno.data_nascimento ? `${calculateAge(aluno.data_nascimento)} anos` : "-"}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {aluno.objetivo ? <Badge variant="secondary">{aluno.objetivo}</Badge> : "-"}
      </TableCell>
      <TableCell className="text-center">
        {aluno.aluno_treinos[0]?.count || 0}
      </TableCell>
      <TableCell className="text-right">
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
      </TableCell>
    </TableRow>
  );
}