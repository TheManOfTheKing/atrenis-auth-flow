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
import { CalendarIcon, Clipboard } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

const generatePassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const alunoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  telefone: z.string().min(10, "Telefone inválido (mínimo 10 dígitos)").max(15, "Telefone inválido (máximo 15 dígitos)"),
  data_nascimento: z.string().refine(date => {
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
  const [generatedPassword, setGeneratedPassword] = useState(generatePassword());

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
      senha: generatedPassword,
      telefone: "",
      data_nascimento: "",
      objetivo: undefined, // Use undefined for initial state of enum
      observacoes: "",
    },
  });

  // Update form's password field when generatedPassword changes
  useEffect(() => {
    form.setValue("senha", generatedPassword);
  }, [generatedPassword, form]);

  const handleGenerateNewPassword = () => {
    setGeneratedPassword(generatePassword());
  };

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
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          data: {
            nome: data.nome,
            role: 'aluno',
            personal_id: personalId,
          },
          emailRedirectTo: `${window.location.origin}/aluno/dashboard`, // Redireciona o aluno para o dashboard após confirmação
        },
      });

      if (authError) throw authError;

      // 2. Atualizar perfil na tabela profiles com dados adicionais
      // O trigger handle_new_user já cria o perfil básico, aqui atualizamos os campos extras
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          telefone: data.telefone,
          data_nascimento: data.data_nascimento,
          objetivo: data.objetivo,
          observacoes_aluno: data.observacoes, // Corrigido para observacoes_aluno
        })
        .eq('id', authData.user?.id);

      if (profileError) throw profileError;

      setNewAlunoCredentials({ email: data.email, senha: data.senha });
      setShowSuccessDialog(true);
      form.reset(); // Limpa o formulário após o sucesso
      setGeneratedPassword(generatePassword()); // Gera nova senha para o próximo cadastro

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar aluno",
        description: error.message === "User already registered" 
          ? "Este email já está cadastrado." 
          : error.message,
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
                      <Input placeholder="Nome do aluno" {...field} />
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
                      <Input type="email" placeholder="email@aluno.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Inicial</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="text" readOnly {...field} />
                      </FormControl>
                      <Button type="button" onClick={handleGenerateNewPassword} variant="outline">
                        Gerar Nova
                      </Button>
                    </div>
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
                      <Input type="tel" placeholder="(XX) XXXXX-XXXX" {...field} />
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
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
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
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Textarea placeholder="Informações adicionais sobre o aluno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/personal/alunos")}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Cadastrar Aluno"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aluno Cadastrado com Sucesso!</DialogTitle>
            <DialogDescription>
              As credenciais de acesso foram geradas. Copie e envie essas informações ao aluno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>Email:</strong> {newAlunoCredentials.email}</p>
            <p><strong>Senha:</strong> {newAlunoCredentials.senha}</p>
          </div>
          <DialogFooter>
            <Button onClick={handleCopyCredentials}>
              <Clipboard className="mr-2 h-4 w-4" /> Copiar Credenciais
            </Button>
            <Button onClick={() => navigate("/personal/alunos")}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}