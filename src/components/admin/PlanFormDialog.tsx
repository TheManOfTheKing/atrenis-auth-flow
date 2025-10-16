import React, { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Loader2, DollarSign, Percent, ArrowUp, ArrowDown } from "lucide-react";
import { planSchema } from "@/lib/validations";
import { Tables, Enums } from "@/integrations/supabase/types";
import { useCreatePlan, useUpdatePlan, useCountPersonalsWithPlan } from "@/hooks/usePlans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PlanCardPreview from "./PlanCardPreview";

type PlanFormData = z.infer<typeof planSchema>;
type Plan = Tables<'plans'>;

interface PlanFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan; // Se for para edição, o plano é passado
}

export default function PlanFormDialog({ isOpen, onClose, plan }: PlanFormDialogProps) {
  const isEditMode = !!plan;
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();

  const { data: personalsCount, isLoading: isLoadingPersonalsCount } = useCountPersonalsWithPlan(plan?.id || null);
  const canChangePlanType = !isEditMode || (isEditMode && personalsCount === 0);

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      tipo: "publico",
      preco_mensal: 0,
      preco_anual: undefined,
      max_alunos: 50,
      recursos: [],
      ativo: true,
      visivel_landing: true,
      ordem_exibicao: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recursos",
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        id: plan.id,
        nome: plan.nome,
        descricao: plan.descricao || "",
        tipo: plan.tipo || "publico",
        preco_mensal: plan.preco_mensal,
        preco_anual: plan.preco_anual || undefined,
        max_alunos: plan.max_alunos || 0,
        recursos: (plan.recursos as string[]) || [],
        ativo: plan.ativo || false,
        visivel_landing: plan.visivel_landing || false,
        ordem_exibicao: plan.ordem_exibicao || 0,
      });
    } else {
      form.reset({
        nome: "",
        descricao: "",
        tipo: "publico",
        preco_mensal: 0,
        preco_anual: undefined,
        max_alunos: 50,
        recursos: [],
        ativo: true,
        visivel_landing: true,
        ordem_exibicao: 0,
      });
    }
  }, [plan, form, isOpen]);

  const watchTipo = form.watch("tipo");
  const watchPrecoMensal = form.watch("preco_mensal");
  const watchPrecoAnual = form.watch("preco_anual");
  const watchVisivelLanding = form.watch("visivel_landing");

  // Auto-set preco_mensal to 0 if type is vitalicio
  useEffect(() => {
    if (watchTipo === 'vitalicio' && form.getValues('preco_mensal') !== 0) {
      form.setValue('preco_mensal', 0);
      form.clearErrors('preco_mensal');
    }
    // Auto-set visivel_landing to false if type is vitalicio
    if (watchTipo === 'vitalicio' && form.getValues('visivel_landing')) {
      form.setValue('visivel_landing', false);
      form.clearErrors('visivel_landing');
    }
  }, [watchTipo, form]);

  const calculateEconomy = useMemo(() => {
    if (watchPrecoMensal > 0 && watchPrecoAnual && watchPrecoAnual > 0) {
      const economy = ((watchPrecoMensal * 12 - watchPrecoAnual) / (watchPrecoMensal * 12)) * 100;
      return Math.round(economy);
    }
    return 0;
  }, [watchPrecoMensal, watchPrecoAnual]);

  const onSubmit = async (data: PlanFormData) => {
    if (isEditMode) {
      updatePlanMutation.mutate({ ...data, id: plan?.id });
    } else {
      createPlanMutation.mutate(data);
    }
    onClose();
  };

  const isLoading = createPlanMutation.isPending || updatePlanMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Plano" : "Criar Novo Plano"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Ajuste os detalhes do plano de assinatura." : "Preencha os detalhes para um novo plano de assinatura."}
            {isEditMode && personalsCount !== undefined && personalsCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Este plano está sendo utilizado por {personalsCount} personal trainer(s).
                Alguns campos podem estar desabilitados.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <Tabs defaultValue="basic-info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic-info">Informações</TabsTrigger>
                <TabsTrigger value="pricing-limits">Preços e Limites</TabsTrigger>
                <TabsTrigger value="features">Recursos</TabsTrigger>
                <TabsTrigger value="display">Exibição</TabsTrigger>
              </TabsList>

              {/* Aba "Informações Básicas" */}
              <TabsContent value="basic-info" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Plano</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Plano Básico" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Breve descrição do plano..." {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Plano</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                          disabled={isLoading || !canChangePlanType}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="publico" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Público (Disponível para novos personals)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="vitalicio" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Vitalício (Preço zero, não visível na landing)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      {!canChangePlanType && (
                        <FormDescription className="text-destructive">
                          Não é possível alterar o tipo de plano pois ele já está em uso.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status Ativo</FormLabel>
                        <FormDescription>
                          Define se o plano está visível e disponível para atribuição.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Aba "Preços e Limites" */}
              <TabsContent value="pricing-limits" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preco_mensal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Mensal (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="97.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              disabled={isLoading || watchTipo === 'vitalicio'}
                              className="pl-9"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preco_anual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Anual (R$) (Opcional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="970.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              disabled={isLoading || watchTipo === 'vitalicio'}
                              className="pl-9"
                            />
                          </div>
                        </FormControl>
                        {calculateEconomy > 0 && (
                          <FormDescription className="text-green-600">
                            Economia de {calculateEconomy}% no plano anual!
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="max_alunos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Alunos (0 para ilimitado)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Aba "Recursos" */}
              <TabsContent value="features" className="space-y-4 mt-4">
                <FormItem>
                  <FormLabel>Recursos Incluídos</FormLabel>
                  <FormDescription>
                    Liste os principais recursos e benefícios deste plano.
                  </FormDescription>
                  <div className="space-y-2">
                    {fields.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Input
                          placeholder="Ex: Acesso a biblioteca de treinos"
                          {...form.register(`recursos.${index}`)}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append("")}
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Recurso
                    </Button>
                  </div>
                  <FormMessage>{form.formState.errors.recursos?.message}</FormMessage>
                </FormItem>
              </TabsContent>

              {/* Aba "Exibição" */}
              <TabsContent value="display" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="visivel_landing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Visível na Landing Page</FormLabel>
                        <FormDescription>
                          Define se este plano será exibido na página inicial para novos usuários.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || watchTipo === 'vitalicio'}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {watchTipo === 'vitalicio' && watchVisivelLanding && (
                  <p className="text-sm text-destructive">
                    Planos vitalícios não podem ser visíveis na landing page.
                  </p>
                )}

                <FormField
                  control={form.control}
                  name="ordem_exibicao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de Exibição</FormLabel>
                      <FormDescription>
                        Número para controlar a ordem em que os planos aparecem na landing page (menor número = primeiro).
                      </FormDescription>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Prévia do Card do Plano</h3>
                  <PlanCardPreview plan={form.getValues()} />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  isEditMode ? "Salvar Alterações" : "Criar Plano"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}