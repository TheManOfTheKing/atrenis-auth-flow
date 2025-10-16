import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, ListChecks, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WORKOUT_TYPES = [
  "A", "B", "C", "D", "E", "F", "Cardio", "Funcional", "Personalizado", "Outro"
];

const treinoInfoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  tipo: z.enum(WORKOUT_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: "Selecione um tipo de treino" }),
  }),
  duracao_estimada_min: z.coerce.number().min(5, "Duração mínima de 5 minutos").max(180, "Duração máxima de 180 minutos"),
  descricao: z.string().optional(),
});

type TreinoInfoFormData = z.infer<typeof treinoInfoSchema>;

// Estado global simulado para o formulário multi-step
interface TreinoEmCriacaoState {
  step1: TreinoInfoFormData;
  exercicios: any[]; // Será preenchido na Step 2
  alunosParaAtribuir: any[]; // Será preenchido na Step 3
}

export default function NovoTreino() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [treinoEmCriacao, setTreinoEmCriacao] = useState<TreinoEmCriacaoState>({
    step1: {
      nome: "",
      tipo: undefined as any, // Zod enum expects undefined for initial empty state
      duracao_estimada_min: 60,
      descricao: "",
    },
    exercicios: [],
    alunosParaAtribuir: [],
  });
  const [personalId, setPersonalId] = useState<string | null>(null);

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

  const form = useForm<TreinoInfoFormData>({
    resolver: zodResolver(treinoInfoSchema),
    defaultValues: treinoEmCriacao.step1,
  });

  const handleNext = async () => {
    const isValid = await form.trigger(); // Valida apenas os campos do Step 1
    if (isValid) {
      setTreinoEmCriacao(prev => ({ ...prev, step1: form.getValues() }));
      setCurrentStep(2); // Avança para a próxima etapa
    } else {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  // Renderiza o conteúdo de cada etapa
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Treino <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Treino A - Peito e Tríceps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WORKOUT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duracao_estimada_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração Estimada (minutos) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" min="5" max="180" placeholder="60" {...field} />
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
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva o objetivo e características deste treino..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        );
      case 2:
        return (
          <div className="text-center py-10">
            <h3 className="text-xl font-semibold mb-4">Adicionar Exercícios</h3>
            <p className="text-muted-foreground">Esta etapa será implementada em breve.</p>
            <Dumbbell className="h-16 w-16 text-muted-foreground mx-auto mt-6" />
          </div>
        );
      case 3:
        return (
          <div className="text-center py-10">
            <h3 className="text-xl font-semibold mb-4">Revisar e Salvar</h3>
            <p className="text-muted-foreground">Esta etapa será implementada em breve.</p>
            <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mt-6" />
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
            <Button disabled>
              Salvar Treino (Em Breve)
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}