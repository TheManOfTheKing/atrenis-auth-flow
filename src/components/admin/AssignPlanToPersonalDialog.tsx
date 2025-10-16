import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, Percent, CalendarDays, Users } from "lucide-react";
import { assignPlanSchema } from "@/lib/validations";
import { usePlans } from "@/hooks/usePlans";
import { useAssignPlan } from "@/hooks/useAssignPlan";
import { PersonalTrainerAdminView } from "@/hooks/useAdminPersonalTrainers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

type AssignPlanFormData = z.infer<typeof assignPlanSchema>;

interface AssignPlanToPersonalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personal: PersonalTrainerAdminView | null;
}

export default function AssignPlanToPersonalDialog({ isOpen, onClose, personal }: AssignPlanToPersonalDialogProps) {
  const { data: availablePlans, isLoading: isLoadingPlans } = usePlans({ ativo: true });
  const assignPlanMutation = useAssignPlan();

  const form = useForm<AssignPlanFormData>({
    resolver: zodResolver(assignPlanSchema),
    defaultValues: {
      personalId: personal?.id || "",
      planId: personal?.plan_id || "",
      desconto_percentual: personal?.desconto_percentual || 0,
      periodo: "mensal", // Default to monthly
    },
  });

  useEffect(() => {
    if (personal) {
      form.reset({
        personalId: personal.id,
        planId: personal.plan_id || "",
        desconto_percentual: personal.desconto_percentual || 0,
        periodo: "mensal", // Reset to default, or try to infer from existing plan
      });
    }
  }, [personal, form, isOpen]);

  const selectedPlanId = form.watch("planId");
  const descontoPercentual = form.watch("desconto_percentual");
  const periodo = form.watch("periodo");

  const selectedPlan = useMemo(() => {
    return availablePlans?.find(plan => plan.id === selectedPlanId);
  }, [availablePlans, selectedPlanId]);

  const valorOriginal = useMemo(() => {
    if (!selectedPlan) return 0;
    return periodo === 'mensal' ? selectedPlan.preco_mensal : (selectedPlan.preco_anual || selectedPlan.preco_mensal * 12);
  }, [selectedPlan, periodo]);

  const valorFinal = useMemo(() => {
    if (!valorOriginal) return 0;
    const discountAmount = (valorOriginal * (descontoPercentual || 0)) / 100;
    return valorOriginal - discountAmount;
  }, [valorOriginal, descontoPercentual]);

  const dataVencimentoEstimada = useMemo(() => {
    if (!periodo) return null;
    const now = new Date();
    if (periodo === 'mensal') {
      return format(new Date(now.setMonth(now.getMonth() + 1)), "PPP", { locale: ptBR });
    } else if (periodo === 'anual') {
      return format(new Date(now.setFullYear(now.getFullYear() + 1)), "PPP", { locale: ptBR });
    }
    return null;
  }, [periodo]);

  const onSubmit = async (data: AssignPlanFormData) => {
    assignPlanMutation.mutate({
      personalId: data.personalId,
      planId: data.planId,
      desconto_percentual: data.desconto_percentual,
      periodo: data.periodo,
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const isLoading = assignPlanMutation.isPending;

  if (!personal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atribuir/Editar Plano para {personal.nome}</DialogTitle>
          <DialogDescription>
            Gerencie o plano de assinatura e os detalhes para este personal trainer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="personalId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Plano Atual:</p>
                <div className="flex items-center gap-2 mt-1">
                  {personal.plan_nome ? (
                    <Badge variant="secondary">{personal.plan_nome}</Badge>
                  ) : (
                    <Badge variant="outline">Nenhum Plano</Badge>
                  )}
                  {personal.status_assinatura && personal.status_assinatura !== 'pendente' && (
                    <Badge
                      className={`
                        ${personal.status_assinatura === 'ativa' && 'bg-secondary-green text-white'}
                        ${personal.status_assinatura === 'vencida' && 'bg-secondary-red text-white'}
                        ${personal.status_assinatura === 'trial' && 'bg-secondary-blue text-white'}
                        ${personal.status_assinatura === 'cancelada' && 'bg-gray-400 text-white'}
                      `}
                    >
                      {personal.status_assinatura.charAt(0).toUpperCase() + personal.status_assinatura.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecionar Novo Plano</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isLoadingPlans}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPlans ? (
                        <SelectItem value="loading" disabled>Carregando planos...</SelectItem>
                      ) : availablePlans && availablePlans.length > 0 ? (
                        availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.nome} (R$ {plan.preco_mensal.toFixed(2)}/mês)
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-plans" disabled>Nenhum plano ativo disponível</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de Assinatura</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || !selectedPlan}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      {selectedPlan?.preco_anual && selectedPlan.preco_anual > 0 && (
                        <SelectItem value="anual">Anual</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desconto_percentual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto Percentual (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        disabled={isLoading}
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 mt-4 p-3 border rounded-md bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Valor Original ({periodo === 'mensal' ? 'mês' : 'ano'}):</span>
                <span>R$ {valorOriginal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Desconto Aplicado:</span>
                <span>{descontoPercentual || 0}%</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-primary-yellow">
                <span>Valor Final:</span>
                <span>R$ {valorFinal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Vencimento Estimado:</span>
                <span>{dataVencimentoEstimada || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Limite de Alunos:</span>
                <span>{selectedPlan?.max_alunos === 0 ? 'Ilimitado' : selectedPlan?.max_alunos || 'N/A'}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !selectedPlanId}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atribuindo...
                  </>
                ) : (
                  "Atribuir Plano"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}