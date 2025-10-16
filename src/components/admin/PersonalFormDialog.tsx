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
import { Loader2, Clipboard } from "lucide-react";
import InputMask from "react-input-mask";
import { personalAdminSchema } from "@/lib/validations";
import { usePlans } from "@/hooks/usePlans";
import { useCreatePersonalByAdmin, useUpdatePersonalByAdmin, useResetPersonalPasswordAdmin } from "@/hooks/usePersonalAdminCrud";
import { PersonalTrainerAdminView } from "@/hooks/useAdminPersonalTrainers";
import { toast } from "@/hooks/use-toast";

type PersonalFormData = z.infer<typeof personalAdminSchema>;

interface PersonalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personal?: PersonalTrainerAdminView | null; // Se for para edição
}

export default function PersonalFormDialog({ isOpen, onClose, personal }: PersonalFormDialogProps) {
  const isEditMode = !!personal;
  const createPersonalMutation = useCreatePersonalByAdmin();
  const updatePersonalMutation = useUpdatePersonalByAdmin();
  const resetPasswordMutation = useResetPersonalPasswordAdmin();

  const { data: availablePlans, isLoading: isLoadingPlans } = usePlans({ ativo: true });

  const form = useForm<PersonalFormData>({
    resolver: zodResolver(personalAdminSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      cref: "",
      planId: "",
      desconto_percentual: 0,
      periodo: "none",
    },
  });

  const { watch, reset, handleSubmit, formState: { errors } } = form;

  useEffect(() => {
    if (personal && isEditMode) {
      reset({
        id: personal.id,
        nome: personal.nome,
        email: personal.email,
        telefone: personal.telefone || "",
        cref: personal.cref || "",
        planId: personal.plan_id || "",
        desconto_percentual: personal.desconto_percentual || 0,
        periodo: personal.data_assinatura && personal.data_vencimento ? (
          (new Date(personal.data_vencimento).getMonth() !== new Date(personal.data_assinatura).getMonth() + 1) ? 'anual' : 'mensal'
        ) : 'none',
      });
    } else {
      reset({
        nome: "",
        email: "",
        telefone: "",
        cref: "",
        planId: "",
        desconto_percentual: 0,
        periodo: "none",
      });
    }
  }, [personal, isEditMode, reset, isOpen]);

  const selectedPlanId = watch("planId");
  const selectedPeriodo = watch("periodo");
  const selectedDesconto = watch("desconto_percentual");

  const currentPlan = useMemo(() => {
    return availablePlans?.find(plan => plan.id === selectedPlanId);
  }, [availablePlans, selectedPlanId]);

  const valorOriginal = useMemo(() => {
    if (!currentPlan || selectedPeriodo === 'none') return 0;
    return selectedPeriodo === 'mensal' ? currentPlan.preco_mensal : (currentPlan.preco_anual || currentPlan.preco_mensal * 12);
  }, [currentPlan, selectedPeriodo]);

  const valorFinal = useMemo(() => {
    if (!valorOriginal) return 0;
    const discountAmount = (valorOriginal * (selectedDesconto || 0)) / 100;
    return valorOriginal - discountAmount;
  }, [valorOriginal, selectedDesconto]);

  const onSubmit = async (data: PersonalFormData) => {
    if (isEditMode) {
      updatePersonalMutation.mutate(data, {
        onSuccess: () => onClose(),
      });
    } else {
      createPersonalMutation.mutate(data, {
        onSuccess: (response) => {
          if (response.temp_password) {
            toast({
              title: "Personal Trainer Criado!",
              description: `Email: ${response.email}, Senha Temporária: ${response.temp_password}. Copie e forneça ao personal.`,
              duration: 10000,
              action: {
                label: "Copiar Senha",
                onClick: () => navigator.clipboard.writeText(response.temp_password || ''),
              },
            });
          }
          onClose();
        },
      });
    }
  };

  const handleResetPassword = () => {
    if (!personal?.id) return;
    resetPasswordMutation.mutate(personal.id, {
      onSuccess: (response) => {
        if (response.new_password) {
          toast({
            title: "Senha Resetada!",
            description: `Nova senha temporária: ${response.new_password}. Copie e forneça ao personal.`,
            duration: 10000,
            action: {
              label: "Copiar Senha",
              onClick: () => navigator.clipboard.writeText(response.new_password || ''),
            },
          });
        }
      },
    });
  };

  const isLoading = createPersonalMutation.isPending || updatePersonalMutation.isPending || resetPasswordMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Personal Trainer" : "Novo Personal Trainer"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Atualize os dados do personal trainer." : "Preencha os dados para cadastrar um novo personal trainer."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do Personal" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@personal.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl>
                      <InputMask
                        mask="(99) 99999-9999"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      >
                        {(inputProps: any) => (
                          <Input
                            {...inputProps}
                            type="tel"
                            placeholder="(XX) XXXXX-XXXX"
                          />
                        )}
                      </InputMask>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CREF (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CREF 123456-G/SP" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">Atribuição de Plano (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="planId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isLoadingPlans}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum Plano</SelectItem>
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
                    <FormLabel>Período</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || !selectedPlanId || currentPlan?.tipo === 'vitalicio'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Não Atribuir</SelectItem>
                        {currentPlan?.tipo !== 'vitalicio' && (
                          <>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            {currentPlan?.preco_anual && currentPlan.preco_anual > 0 && (
                              <SelectItem value="anual">Anual</SelectItem>
                            )}
                          </>
                        )}
                        {currentPlan?.tipo === 'vitalicio' && (
                          <SelectItem value="vitalicio">Vitalício</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedPlanId && selectedPeriodo !== 'none' && currentPlan?.tipo !== 'vitalicio' && (
              <FormField
                control={form.control}
                name="desconto_percentual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto Percentual (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedPlanId && selectedPeriodo !== 'none' && (
              <div className="space-y-2 mt-4 p-3 border rounded-md bg-muted/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Valor Original ({selectedPeriodo === 'mensal' ? 'mês' : 'ano'}):</span>
                  <span>R$ {valorOriginal.toFixed(2)}</span>
                </div>
                {currentPlan?.tipo !== 'vitalicio' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Desconto Aplicado:</span>
                    <span>{selectedDesconto || 0}%</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold text-primary-yellow">
                  <span>Valor Final:</span>
                  <span>R$ {valorFinal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-6">
              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Clipboard className="mr-2 h-4 w-4" />
                  )}
                  Resetar Senha
                </Button>
              )}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    isEditMode ? "Salvar Alterações" : "Criar Personal"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}