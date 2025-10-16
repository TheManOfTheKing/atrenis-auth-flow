import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, Clipboard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // Importar locale para formatação de data
import { cn } from "@/lib/utils";
import InputMask from "react-input-mask"; // Importar InputMask

const calculateAge = (dateString: string): number => {
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const alunoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").refine(async (email) => {
    // Validação assíncrona para verificar se o email já existe
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    return !data; // Retorna true se o email NÃO existir
  }, {
    message: "Este email já está cadastrado.",
    path: ["email"],
  }),
  telefone: z.string().refine(val => {
    // Remove caracteres não numéricos para validação
    const cleaned = val.replace(/\D/g, '');
    // Valida formato de telefone brasileiro (10 ou 11 dígitos)
    return /^\d{10,11}$/.test(cleaned);
  }, "Telefone inválido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX"),
  data_nascimento: z.string().refine(date => {
    if (!date) return false; // Data de nascimento é obrigatória
    const age = calculateAge(date);
    return age >= 12 && age <= 120;
  }, "Idade deve estar entre 12 e 120 anos"),
  objetivo: z.enum(['emagrecimento', 'hipertrofia', 'condicionamento', 'reabilitacao', 'outro'], {
    errorMap: () => ({ message: "Selecione um objetivo" }),
  }),
  observacoes: z.string().optional(),
});

type AlunoFormData = z.infer<typeof alunoSchema>;

export default function NovoAluno() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [personalId, setPersonalId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newAlunoCredentials, setNewAlunoCredentials] = useState({ email: "", senha: "" });

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

  const form = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      data_nascimento: "",
      objetivo: undefined,
      observacoes: "",
    },
  });

  const onSubmit = async (data: AlunoFormData) => {
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
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_aluno_by_personal', {
        p_email: data.email,
        p_nome: data.nome,
        p_telefone: data.telefone,
        p_data_nascimento: data.data_nascimento,
        p_objetivo: data.objetivo,
        p_observacoes: data.observacoes,
      });

      if (rpcError) throw rpcError;
      if (!rpcData.success) throw new Error(rpcData.error || "Erro desconhecido ao criar aluno.");

      setNewAlunoCredentials({ email: rpcData.email, senha: rpcData.temp_password });
      setShowSuccessDialog(true);
      form.reset(); // Limpa o formulário após o sucesso

    } catch (error: any) {
      let errorMessage = "Erro ao cadastrar aluno. Tente novamente.";
      if (error.message.includes("Email já cadastrado no sistema")) {
        errorMessage = "Este email já está cadastrado. Por favor, use outro email.";
      } else if (error.message.includes("Aluno não pertence a este personal trainer")) {
        errorMessage = "Erro de permissão: O aluno não pode ser atribuído a este personal.";
      } else {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Erro ao cadastrar aluno",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${newAlunoCredentials.email}\nSenha: ${newAlunoCredentials.senha}`);
    toast({
      title: "Credenciais copiadas!",
      description: "Email e senha do aluno copiados para a área de transferência.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastrar Novo Aluno</CardTitle>
          <CardDescription>Preencha os dados para criar uma nova conta de aluno.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do aluno" {...field} disabled={isLoading} />
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
                      <Input type="email" placeholder="email@aluno.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
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
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Nascimento</FormLabel>
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01") || isLoading
                          }
                          initialFocus
                          locale={ptBR}
                          captionLayout="dropdown" // Adicionado para permitir seleção de ano e mês
                          fromYear={1900} // Define o ano inicial para o dropdown
                          toYear={new Date().getFullYear()} // Define o ano final para o dropdown
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo Principal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o objetivo do aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                        <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                        <SelectItem value="condicionamento">Condicionamento</SelectItem>
                        <SelectItem value="reabilitacao">Reabilitação</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Informações adicionais sobre o aluno" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/personal/alunos")} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...
                    </>
                  ) : (
                    "Cadastrar Aluno"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aluno Cadastrado com Sucesso! 🎉</DialogTitle>
            <DialogDescription>
              As credenciais de acesso foram geradas. Copie e envie essas informações ao aluno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>Email:</strong> {newAlunoCredentials.email}</p>
            <p><strong>Senha temporária:</strong> {newAlunoCredentials.senha}</p>
          </div>
          <DialogFooter>
            <Button onClick={handleCopyCredentials}>
              <Clipboard className="mr-2 h-4 w-4" /> Copiar Credenciais
            </Button>
            <Button onClick={() => navigate("/personal/alunos")}>
              Ir para Lista de Alunos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}