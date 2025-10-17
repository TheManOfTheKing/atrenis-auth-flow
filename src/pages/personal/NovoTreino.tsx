import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dumbbell, ListChecks, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { workoutFormSchema, WorkoutFormData } from "@/lib/validations";
import { WorkoutExercisesStep } from "@/components/personal/treinos/WorkoutExercisesStep";

const WORKOUT_TYPES = [
  "A", "B", "C", "D", "E", "F", "Cardio", "Funcional", "Personalizado", "Outro"
];

export default function NovoTreino() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [personalId, setPersonalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      tipo: "personalizado",
      duracao_estimada_min: 60,
      exercicios: []
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setPersonalId(user.id);
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger(['nome', 'descricao', 'tipo', 'duracao_estimada_min']);
      if (!isValid) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: "Por favor, preencha todos os campos obrigatórios corretamente.",
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      const exercicios = form.getValues('exercicios');
      if (!exercicios || exercicios.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos 1 exercício ao treino",
          variant: "destructive"
        });
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    if (!personalId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const formData = form.getValues();
      
      // 1. Criar o treino
      const { data: treino, error: treinoError } = await supabase
        .from('treinos')
        .insert({
          personal_id: personalId,
          nome: formData.nome,
          descricao: formData.descricao || null,
          tipo: formData.tipo,
          duracao_estimada_min: formData.duracao_estimada_min || 60
        })
        .select()
        .single();
      
      if (treinoError) throw treinoError;
      
      // 2. Inserir exercícios do treino
      const treinoExercicios = formData.exercicios.map(ex => ({
        treino_id: treino.id,
        exercicio_id: ex.exercicio_id,
        ordem: ex.ordem,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga: ex.carga || null,
        descanso_seg: ex.descanso_seg,
        observacoes: ex.observacoes || null
      }));
      
      const { error: exerciciosError } = await supabase
        .from('treino_exercicios')
        .insert(treinoExercicios);
      
      if (exerciciosError) throw exerciciosError;
      
      toast({
        title: "Sucesso!",
        description: "Treino criado com sucesso"
      });
      
      // Redirecionar para a lista de treinos
      navigate('/personal/treinos');
      
    } catch (error: any) {
      console.error('Erro ao criar treino:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o treino",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderiza o conteúdo de cada etapa
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Treino <span className="text-red-500">*</span></label>
                <input
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ex: Treino A - Peito e Tríceps"
                  {...form.register('nome')}
                />
                {form.formState.errors.nome && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.nome.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Tipo <span className="text-red-500">*</span></label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  {...form.register('tipo')}
                >
                  <option value="">Selecione o tipo</option>
                  {WORKOUT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {form.formState.errors.tipo && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.tipo.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Duração Estimada (minutos) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="60"
                  {...form.register('duracao_estimada_min', { valueAsNumber: true })}
                />
                {form.formState.errors.duracao_estimada_min && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.duracao_estimada_min.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Descrição (Opcional)</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Descreva o objetivo e características deste treino..."
                  rows={4}
                  {...form.register('descricao')}
                />
                {form.formState.errors.descricao && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.descricao.message}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return <WorkoutExercisesStep form={form} />;
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Revisar Treino</h3>
              <p className="text-muted-foreground">Confira as informações antes de salvar</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Informações do Treino</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Nome:</strong> {form.getValues('nome')}</p>
                  <p><strong>Tipo:</strong> {form.getValues('tipo')}</p>
                  <p><strong>Duração:</strong> {form.getValues('duracao_estimada_min')} minutos</p>
                  {form.getValues('descricao') && (
                    <p><strong>Descrição:</strong> {form.getValues('descricao')}</p>
                  )}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Exercícios ({form.getValues('exercicios').length})</h4>
                <div className="space-y-2">
                  {form.getValues('exercicios').map((exercicio, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                        {exercicio.ordem}
                      </span>
                      <span>{exercicio.series} séries × {exercicio.repeticoes} reps</span>
                      {exercicio.carga && <span className="text-muted-foreground">({exercicio.carga})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Criar Novo Treino</CardTitle>
          <CardDescription>Siga os passos para montar um treino completo.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Indicador de Progresso */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                currentStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                1
              </div>
              <span className="ml-2 text-sm md:text-base">Informações</span>
            </div>
            <div className="h-px bg-border flex-1" />
            <div className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                currentStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                2
              </div>
              <span className="ml-2 text-sm md:text-base">Exercícios</span>
            </div>
            <div className="h-px bg-border flex-1" />
            <div className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                3
              </div>
              <span className="ml-2 text-sm md:text-base">Revisar</span>
            </div>
          </div>

          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/personal/treinos')}>
            Cancelar
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          )}
          {currentStep < 3 && (
            <Button onClick={handleNext}>
              Próximo: {currentStep === 1 ? "Adicionar Exercícios" : "Revisar e Salvar"}
            </Button>
          )}
          {currentStep === 3 && (
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Treino"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}