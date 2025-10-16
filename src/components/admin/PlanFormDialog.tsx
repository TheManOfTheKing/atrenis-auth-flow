import React, { useState, useEffect } from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Loader2 } from "lucide-react";
import { planSchema } from "@/lib/validations";
import { Tables } from "@/integrations/supabase/types";
import { useCreatePlan, useUpdatePlan } from "@/hooks/usePlans";

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

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      preco_mensal: 0,
      preco_anual: undefined,
      max_alunos: 0,
      recursos: [],
      ativo: true,
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
        preco_mensal: plan.preco_mensal,
        preco_anual: plan.preco_anual || undefined,
        max_alunos: plan.max_alunos || 0,
        recursos: (plan.recursos as string[]) || [],
        ativo: plan.ativo || false,
      });
    } else {
      form.reset({
        nome: "",
        descricao: "",
        preco_mensal: 0,
        preco_anual: undefined,
        max_alunos: 0,
        recursos: [],
        ativo: true,
      });
    }
  }, [plan, form, isOpen]);

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Plano" : "Criar Novo Plano"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Ajuste os detalhes do plano de assinatura." : "Preencha os detalhes para um novo plano de assinatura."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preco_mensal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Mensal (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="97.00" {...field} disabled={isLoading} />
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
                      <Input type="number" step="0.01" placeholder="970.00" {...field} disabled={isLoading} />
                    </FormControl>
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
                  <FormLabel>Limite de Alunos</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="20" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Recursos</FormLabel>
              <div className="space-y-2">
                {fields.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Recurso do plano"
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