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
import { CalendarIcon, Clipboard, Loader2, ChevronLeft, ChevronRight } from "lucide-react"; // Adicionado ChevronLeft e ChevronRight
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // Importar localização em português
import { cn } from "@/lib/utils";
import InputMask from "react-input-mask";
import { useCreateAluno } from "@/hooks/useCreateAluno";
import { alunoSchema } from "@/lib/validations";

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

type AlunoFormData = z.infer<typeof alunoSchema>;

export default function NovoAluno() {
  const navigate = useNavigate();
  const [personalId, setPersonalId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newAlunoCredentials, setNewAlunoCredentials] = useState({ email: "", senha: "" });

  const { mutate: createAluno, isLoading, error } = useCreateAluno();

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

    createAluno(
      {
        email: data.email,
        nome: data.nome,
        telefone: data.telefone,
        data_nascimento: data.data_nascimento,
        objetivo: data.objetivo,
        observacoes: data.observacoes,
      },
      {
        onSuccess: (response) => {
          if (response.success && response.email && response.temp_password) {
            setNewAlunoCredentials({ email: response.email, senha: response.temp_password });
            setShowSuccessDialog(true);
            form.reset(); // Limpa o formulário após o sucesso
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao cadastrar aluno",
              description: response.error || "Erro desconhecido ao criar aluno.",
            });
          }
        },
        onError: (err) => {
          let errorMessage = "Erro ao cadastrar aluno. Tente novamente.";
          if (err.message.includes("Email já cadastrado no sistema")) {
            errorMessage = "Este email já está cadastrado. Por favor, use outro email.";
          } else if (err.message.includes("Apenas personal trainers podem criar alunos")) {
            errorMessage = "Erro de permissão: Apenas personal trainers podem criar alunos.";
          } else {
            errorMessage = err.message;
          }

          toast({
            variant: "destructive",
            title: "Erro ao cadastrar aluno",
            description: errorMessage,
          });
        },
      }
    );
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
                          locale={ptBR} // Adicionado para português do Brasil
                          captionLayout="dropdown" // Adicionado para corrigir o layout do seletor de mês/ano
                          fromYear={1900} // Adicionado para melhor navegação de ano
                          toYear={new Date().getFullYear()} // Adicionado para melhor navegação de ano
                          classNames={{ // Adicionado para corrigir o layout e estilo
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                          }}
                          components={{ // Adicionado para usar os ícones do lucide-react
                            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                            IconRight: () => <ChevronRight className="h-4 w-4" />,
                          }}
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