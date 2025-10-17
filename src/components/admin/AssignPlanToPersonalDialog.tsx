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
import { Loader2, DollarSign, Percent, CalendarDays, Users, History, XCircle, Info, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { assignPlanSchema } from "@/lib/validations";
import { usePlans } from "@/hooks/usePlans";
import { useAssignPlan } from "@/hooks/useAssignPlan";
import { useCancelPlan } from "@/hooks/useCancelPlan"; // New hook
import { usePersonalPlanHistory } from "@/hooks/usePersonalPlanHistory"; // New hook
import { PersonalTrainerAdminView } from "@/hooks/useAdminPersonalTrainers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider"; // Import Slider

type AssignPlanFormData = z.infer<typeof assignPlanSchema>;

interface AssignPlanToPersonalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personal: PersonalTrainerAdminView | null;
}

export default function AssignPlanToPersonalDialog({ isOpen, onClose, personal }: AssignPlanToPersonalDialogProps) {
  const { data: availablePlans, isLoading: isLoadingPlans } = usePlans({ ativo: true });
  const assignPlanMutation = useAssignPlan();
  const cancelPlanMutation = useCancelPlan();
  const { data: planHistory, isLoading: isLoadingHistory } = usePersonalPlanHistory(personal?.id || null);

  const [currentTab, setCurrentTab] = useState("assign-plan");
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cancelImmediately, setCancelImmediately] = useState(false);

  const form = useForm<AssignPlanFormData>({
    resolver: zodResolver(assignPlanSchema),
    defaultValues: {
      personalId: personal?.id || "",
      planId: personal?.plan_id || "",
      desconto_percentual: personal?.desconto_percentual || 0,
      periodo: "mensal", // Default to monthly
      data_inicio: format(new Date(), "yyyy-MM-dd"),
      observacoes: "",
    },
  });

  useEffect(() => {
    if (personal) {
      const defaultPeriod = personal.plano_vitalicio ? 'vitalicio' : (personal.status_assinatura === 'ativo' && personal.data_assinatura && personal.data_vencimento && (new Date(personal.data_vencimento).getMonth() !== new Date(personal.data_assinatura).getMonth() + 1)) ? 'anual' : 'mensal';
      form.reset({
        personalId: personal.id,
        planId: personal.plan_id || "",
        desconto_percentual: personal.desconto_percentual || 0,
        periodo: defaultPeriod,
        data_inicio: format(new Date(), "yyyy-MM-dd"),
        observacoes: "",
      });
      setCurrentTab("assign-plan"); // Reset tab on open
      setCancelMotivo("");
      setCancelImmediately(false);
    }
  }, [personal, form, isOpen]);

  const selectedPlanId = form.watch("planId");
  const descontoPercentual = form.watch("desconto_percentual");
  const periodo = form.watch("periodo");
  const dataInicio = form.watch("data_inicio");

  const selectedPlan = useMemo(() => {
    return availablePlans?.find(plan => plan.id === selectedPlanId);
  }, [availablePlans, selectedPlanId]);

  // Auto-set periodo if selected plan is vitalicio
  useEffect(() => {
    if (selectedPlan?.tipo === 'vitalicio' && periodo !== 'vitalicio') {
      form.setValue('periodo', 'vitalicio');
    }
  }, [selectedPlan, periodo, form]);

  const valorOriginal = useMemo(() => {
    if (!selectedPlan || periodo === 'none' || periodo === 'vitalicio') return 0;
    return periodo === 'mensal' ? selectedPlan.preco_mensal : (selectedPlan.preco_anual || selectedPlan.preco_mensal * 12);
  }, [selectedPlan, periodo]);

  const valorFinal = useMemo(() => {
    if (!valorOriginal) return 0;
    const discountAmount = (valorOriginal * (descontoPercentual || 0)) / 100;
    return valorOriginal - discountAmount;
  }, [valorOriginal, descontoPercentual]);

  const dataVencimentoEstimada = useMemo(() => {
    if (!dataInicio || !periodo || periodo === 'none' || periodo === 'vitalicio') return null;
    const startDate = new Date(dataInicio);
    if (periodo === 'mensal') {
      return format(new Date(startDate.setMonth(startDate.getMonth() + 1)), "PPP", { locale: ptBR });
    } else if (periodo === 'anual') {
      return format(new Date(startDate.setFullYear(startDate.getFullYear() + 1)), "PPP", { locale: ptBR });
    }
    return null;
  }, [dataInicio, periodo]);

  const onSubmit = async (data: AssignPlanFormData) => {
    if (!personal) return;
    assignPlanMutation.mutate({
      personalId: data.personalId,
      planId: data.planId,
      desconto_percentual: data.desconto_percentual,
      periodo: data.periodo,
      data_inicio: data.data_inicio,
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleCancelPlan = async () => {
    if (!personal) return;
    cancelPlanMutation.mutate({
      personalId: personal.id,
      motivo_cancelamento: cancelMotivo || undefined,
      cancel_immediately: cancelImmediately,
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const isLoading = assignPlanMutation.isPending || cancelPlanMutation.isPending;

  if (!personal) return null;

  const hasActivePlan = personal.plan_id && personal.status_assinatura && ['ativo', 'trial', 'vitalicio'].includes(personal.status_assinatura);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Plano para {personal.nome}</DialogTitle>
          <DialogDescription>
            Atribua, altere ou cancele o plano de assinatura deste personal trainer.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assign-plan">Atribuir/Alterar Plano</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="cancel-plan" disabled={!hasActivePlan}>Cancelar Plano</TabsTrigger>
          </TabsList>

          {/* Aba "Atribuir/Alterar Plano" */}
          <TabsContent value="assign-plan" className="space-y-4 py-4">
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
                        ${personal.status_assinatura === 'ativo' && 'bg-secondary-green text-white'}
                        ${personal.status_assinatura === 'vencida' && 'bg-secondary-red text-white'}
                        ${personal.status_assinatura === 'trial' && 'bg-secondary-blue text-white'}
                        ${personal.status_assinatura === 'cancelada' && 'bg-gray-400 text-white'}
                        ${personal.status_assinatura === 'pendente' && 'bg-gray-600 text-white'}
                        ${personal.status_assinatura === 'vitalicio' && 'bg-purple-600 text-white'}
                      `}
                    >
                      {personal.status_assinatura === 'ativo' ? 'Ativo' : 
                       personal.status_assinatura === 'vitalicio' ? 'Vitalício' :
                       personal.status_assinatura.charAt(0).toUpperCase() + personal.status_assinatura.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecionar Plano</FormLabel>
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
                                {plan.nome} ({plan.tipo === 'vitalicio' ? 'Vitalício' : `R$ ${plan.preco_mensal.toFixed(2)}/mês`})
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

                {selectedPlan && (
                  <Card className="p-4 bg-muted/50">
                    <CardTitle className="text-lg mb-2">Detalhes do Plano Selecionado</CardTitle>
                    <CardDescription className="mb-3">{selectedPlan.descricao}</CardDescription>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Mensal: R$ {selectedPlan.preco_mensal.toFixed(2)}</p>
                      <p className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Anual: {selectedPlan.preco_anual ? `R$ ${selectedPlan.preco_anual.toFixed(2)}` : 'N/A'}</p>
                      <p className="flex items-center gap-1"><Users className="h-4 w-4" /> Alunos: {selectedPlan.max_alunos === 0 ? 'Ilimitado' : selectedPlan.max_alunos}</p>
                      <p className="flex items-center gap-1"><Info className="h-4 w-4" /> Tipo: {selectedPlan.tipo === 'vitalicio' ? 'Vitalício' : selectedPlan.tipo === 'publico' ? 'Público' : selectedPlan.tipo?.charAt(0).toUpperCase() + selectedPlan.tipo?.slice(1)}</p>
                    </div>
                    {selectedPlan.recursos && (selectedPlan.recursos as string[]).length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-sm mb-1">Recursos:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {(selectedPlan.recursos as string[]).map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="periodo"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Período de Assinatura</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                          disabled={isLoading || !selectedPlanId || selectedPlan?.tipo === 'vitalicio'}
                        >
                          {selectedPlan?.tipo !== 'vitalicio' && (
                            <>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="mensal" />
                                </FormControl>
                                <FormLabel className="font-normal">Mensal</FormLabel>
                              </FormItem>
                              {selectedPlan?.preco_anual && selectedPlan.preco_anual > 0 && (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="anual" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Anual</FormLabel>
                                </FormItem>
                              )}
                            </>
                          )}
                          {selectedPlan?.tipo === 'vitalicio' && (
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="vitalicio" />
                              </FormControl>
                              <FormLabel className="font-normal">Vitalício</FormLabel>
                            </FormItem>
                          )}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {periodo !== 'vitalicio' && (
                  <FormField
                    control={form.control}
                    name="desconto_percentual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto Percentual (%)</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[field.value || 0]}
                            onValueChange={(val) => field.onChange(val[0])}
                            disabled={isLoading || !selectedPlanId || periodo === 'none'}
                            className="mt-2"
                          />
                        </FormControl>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>0%</span>
                          <span>{field.value || 0}%</span>
                          <span>100%</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isLoading}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                            disabled={isLoading}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Adicione observações sobre esta atribuição..." {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedPlanId && periodo !== 'none' && (
                  <div className="space-y-2 mt-4 p-3 border rounded-md bg-muted/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Valor Original ({periodo === 'mensal' ? 'mês' : 'ano'}):</span>
                      <span>R$ {valorOriginal.toFixed(2)}</span>
                    </div>
                    {periodo !== 'vitalicio' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Desconto Aplicado:</span>
                        <span>{descontoPercentual || 0}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-lg font-bold text-primary-yellow">
                      <span>Valor Final:</span>
                      <span>{periodo === 'vitalicio' ? 'Vitalício' : `R$ ${valorFinal.toFixed(2)}`}</span>
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
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading || !selectedPlanId || periodo === 'none'}>
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
          </TabsContent>

          {/* Aba "Histórico" */}
          <TabsContent value="history" className="space-y-4 py-4">
            {isLoadingHistory ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : planHistory && planHistory.length > 0 ? (
              <div className="space-y-4">
                {planHistory.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{entry.plan_nome}</h4>
                      <Badge
                        className={`
                          ${entry.status === 'ativo' && 'bg-secondary-green text-white'}
                          ${entry.status === 'cancelado' && 'bg-secondary-red text-white'}
                          ${entry.status === 'migrado' && 'bg-gray-400 text-white'}
                          ${entry.status === 'vitalicio' && 'bg-purple-600 text-white'}
                        `}
                      >
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Período: {entry.periodo.charAt(0).toUpperCase() + entry.periodo.slice(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Início: {format(new Date(entry.data_inicio), "PPP", { locale: ptBR })}
                      {entry.data_fim && ` - Fim: ${format(new Date(entry.data_fim), "PPP", { locale: ptBR })}`}
                    </p>
                    {entry.valor_final_mensal !== null && (
                      <p className="text-sm text-muted-foreground">
                        Valor Mensal: R$ {entry.valor_final_mensal.toFixed(2)}
                        {entry.desconto_percentual && entry.desconto_percentual > 0 && ` (${entry.desconto_percentual}% OFF)`}
                      </p>
                    )}
                    {entry.valor_final_anual !== null && (
                      <p className="text-sm text-muted-foreground">
                        Valor Anual: R$ {entry.valor_final_anual.toFixed(2)}
                        {entry.desconto_percentual && entry.desconto_percentual > 0 && ` (${entry.desconto_percentual}% OFF)`}
                      </p>
                    )}
                    {entry.motivo_cancelamento && (
                      <p className="text-sm text-destructive mt-2">Motivo Cancelamento: {entry.motivo_cancelamento}</p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">Nenhum histórico de planos encontrado.</p>
            )}
          </TabsContent>

          {/* Aba "Cancelar Plano" */}
          <TabsContent value="cancel-plan" className="space-y-4 py-4">
            {hasActivePlan ? (
              <>
                <div className="bg-red-50 border-l-4 border-secondary-red p-4 text-secondary-red rounded-md flex items-start gap-3">
                  <XCircle className="h-5 w-5 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-lg">Atenção: Cancelamento de Plano</h4>
                    <p className="text-sm">
                      Você está prestes a cancelar o plano atual de {personal.nome}. Esta ação pode afetar o acesso do personal à plataforma e aos seus alunos.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="motivo_cancelamento">Motivo do Cancelamento (Opcional)</Label>
                  <Textarea
                    id="motivo_cancelamento"
                    placeholder="Ex: Pedido do personal, inatividade, migração para outro plano, etc."
                    value={cancelMotivo}
                    onChange={(e) => setCancelMotivo(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="cancel-immediately"
                    checked={cancelImmediately}
                    onCheckedChange={setCancelImmediately}
                    disabled={isLoading}
                  />
                  <Label htmlFor="cancel-immediately">Cancelar imediatamente (o acesso será encerrado hoje)</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleCancelPlan}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...
                      </>
                    ) : (
                      "Confirmar Cancelamento"
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Este personal trainer não possui um plano ativo para ser cancelado.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}