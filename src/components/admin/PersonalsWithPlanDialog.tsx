import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, User } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { usePersonalsWithPlan } from "@/hooks/usePlans";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonalsWithPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string | null;
  planName: string;
}

export default function PersonalsWithPlanDialog({ isOpen, onClose, planId, planName }: PersonalsWithPlanDialogProps) {
  const { data: personals, isLoading, error } = usePersonalsWithPlan(planId);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personal Trainers com o Plano: {planName}</DialogTitle>
          <DialogDescription>
            Lista de personal trainers que atualmente utilizam este plano.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-destructive">Erro ao carregar personal trainers: {error.message}</p>
          ) : personals && personals.length > 0 ? (
            <div className="grid gap-4">
              {personals.map((personal) => (
                <div key={personal.id} className="flex items-center gap-4 p-3 border rounded-md">
                  <Avatar>
                    <AvatarFallback className="bg-secondary-blue text-white">
                      {getInitials(personal.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{personal.nome}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {personal.email}
                    </p>
                    {personal.telefone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {personal.telefone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Nenhum personal trainer encontrado com este plano.</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}