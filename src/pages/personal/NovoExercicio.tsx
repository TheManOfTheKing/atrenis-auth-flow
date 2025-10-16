import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod"; // Manter import para z.infer
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { exercicioSchema } from "@/lib/validations"; // Importar o schema centralizado

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas",
  "Glúteos", "Abdômen", "Cardio", "Funcional", "Outro"
];

type ExercicioFormData = z.infer<typeof exercicioSchema>;

export default function NovoExercicio() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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

  const form = useForm<ExercicioFormData>({
    resolver: zodResolver(exercicioSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      grupo_muscular: undefined,
      video_url: "",
    },
  });

  const onSubmit = async (data: ExercicioFormData) => {
    if (!personalId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID do personal não encontrado. Tente fazer login novamente.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('exercicios')
        .insert({
          nome: data.nome,
          descricao: data.descricao || null,
          grupo_muscular: data.grupo_muscular,
          video_url: data.video_url || null,
          criado_por_personal_id: personalId, // Marca como customizado pelo personal
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Exercício criado!",
        description: "O novo exercício foi adicionado à sua biblioteca.",
      });
      navigate("/personal/exercicios"); // Redireciona de volta para a lista
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar exercício",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Criar Novo Exercício</CardTitle>
          <CardDescription>Adicione um exercício personalizado à sua biblioteca.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Exercício</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Agachamento Livre" {...field} />
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
                      <Textarea placeholder="Detalhes sobre a execução do exercício..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grupo_muscular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo Muscular</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo muscular" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MUSCLE_GROUPS.map((grupo) => (
                          <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Vídeo (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="Ex: https://youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/personal/exercicios")}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90" disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Exercício"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}