import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";

export default function AlunosEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users className="h-24 w-24 text-muted-foreground mb-6" />
      <h3 className="text-2xl font-bold mb-2">Você ainda não tem alunos cadastrados</h3>
      <p className="text-muted-foreground mb-6">
        Comece a gerenciar seus clientes adicionando seu primeiro aluno.
      </p>
      <Link to="/personal/alunos/new">
        <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Primeiro Aluno
        </Button>
      </Link>
    </div>
  );
}