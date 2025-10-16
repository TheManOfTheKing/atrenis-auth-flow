import { useState, useEffect, useCallback } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Importar Alert
import { Progress } from "@/components/ui/progress"; // Importar Progress
import { Badge } from "@/components/ui/badge"; // Importar Badge
import { CheckCircle, Info, Loader2 } from "lucide-react"; // Importar ícones adicionais

// Função para calcular a força da senha
const calculatePasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 25;
  // Adicionar mais complexidade se necessário (caracteres especiais)
  // if (/[!@#$%^&*]/.test(password)) strength += 25;

  let variant: "default" | "secondary" | "destructive" | "outline" | null | undefined = "destructive";
  let text = "Muito Fraca";

  if (strength >= 100) {
    variant = "default"; // Tailwind default green
    text = "Forte";
  } else if (strength >= 75) {
    variant = "secondary"; // Tailwind default gray
    text = "Média";
  } else if (strength >= 50) {
    variant = "outline"; // Tailwind default border
    text = "Fraca";
  }

  return { strength, text, variant };
};

const signupSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
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
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/\d/, "Senha deve conter pelo menos um número"),
  confirmPassword: z.string(),
  cref: z.string().optional().refine((cref) => {
    if (!cref) return true; // Campo opcional, se vazio, é válido
    // Padrão: CREF 000000-G/UF (ex: CREF 123456-G/SP)
    return /^CREF \d{6}-[A-Z]{1}\/[A-Z]{2}$/.test(cref);
  }, {
    message: "Formato do CREF inválido (ex: CREF 123456-G/SP)",
    path: ["cref"],
  }),
  telefone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [newAccountEmail, setNewAccountEmail] = useState("");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "",
      confirmPassword: "",
      cref: "",
      telefone: "",
    },
    mode: "onChange", // Habilita validação em tempo real
  });

  const password = form.watch("password");
  const { strength, text, variant } = calculatePasswordStrength(password);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            role: 'personal', // Hardcoded para 'personal'
            cref: data.cref || null,
            telefone: data.telefone || null,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      setNewAccountEmail(data.email);
      setShowSuccessAlert(true);
      form.reset(); // Limpa o formulário
    } catch (error: any) {
      let errorMessage = "Ocorreu um erro inesperado. Tente novamente.";
      if (error.message.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Por favor, faça login ou use outro email.";
      } else if (error.message.includes("Password should be at least 6 characters")) {
        errorMessage = "A senha deve ter no mínimo 6 caracteres."; // Zod já trata isso, mas como fallback
      } else {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccessAlert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Alert className="w-full max-w-md">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Cadastro realizado com sucesso!</AlertTitle>
          <AlertDescription>
            Verifique seu email ({newAccountEmail}) para confirmar o cadastro e ativar sua conta.
            Após a confirmação, você poderá fazer login.
          </AlertDescription>
          <Button asChild className="mt-4 w-full">
            <Link to="/login">Ir para o Login</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>Cadastre-se no Atrenis como Personal Trainer</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
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
                      <Input type="email" placeholder="seu@email.com" {...field} />
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
                      <Input placeholder="Ex: CREF 123456-G/SP" {...field} />
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
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    {password && (
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={strength} className="h-2 w-full" />
                        <Badge variant={variant}>{text}</Badge>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando sua conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground mt-4">
                Você é um aluno? Seu personal trainer criará sua conta e fornecerá suas credenciais de acesso.
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Faça login
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}