import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom"; // Importar useSearchParams
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert } from "lucide-react"; // Importar ShieldAlert para o Alert
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Importar Alert

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  rememberMe: z.boolean().default(true),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams(); // Hook para gerenciar query params
  const sessionExpired = searchParams.get("expired") === "true";
  const accountDeactivated = searchParams.get("deactivated") === "true"; // Novo param para conta desativada

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  // Limpar os query params após a renderização inicial
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    let changed = false;
    if (sessionExpired) {
      newSearchParams.delete("expired");
      changed = true;
    }
    if (accountDeactivated) {
      newSearchParams.delete("deactivated");
      changed = true;
    }
    if (changed) {
      setSearchParams(newSearchParams, { replace: true }); // Substitui a entrada no histórico
    }
  }, [sessionExpired, accountDeactivated, searchParams, setSearchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
        options: {
          shouldRemember: data.rememberMe,
        },
      });

      if (error) {
        let errorMessage = "Ocorreu um erro inesperado. Tente novamente.";
        if (error.message === "Invalid login credentials") {
          errorMessage = "Email ou senha incorretos.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor, confirme seu email antes de fazer login.";
        } else if (error.message.includes("User not found")) {
          errorMessage = "Usuário não encontrado. Verifique o email digitado.";
        }
        throw new Error(errorMessage);
      }

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("nome, role, ativo") // Buscar também o status 'ativo'
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          toast({
            variant: "destructive",
            title: "Erro ao carregar perfil",
            description: (
              <>
                Não foi possível carregar as informações do seu perfil. Por favor, tente novamente ou{" "}
                <Link to="/contato" className="underline">contate o suporte</Link>.
              </>
            ),
          });
          await supabase.auth.signOut();
          return;
        }

        // Verificar se a conta está ativa (verificar se ativo é false explicitamente)
        if (profile.ativo === false) {
          toast({
            variant: "destructive",
            title: "Conta Desativada",
            description: "Sua conta foi desativada. Entre em contato com o administrador.",
          });
          await supabase.auth.signOut(); // Forçar logout
          navigate("/login?deactivated=true", { replace: true }); // Redirecionar com param
          return;
        }

        toast({
          title: "Login realizado!",
          description: `Bem-vindo(a) ao Atrenis, ${profile.nome.split(' ')[0]}!`,
        });

        if (profile.role === "admin") {
          navigate("/admin/dashboard");
        } else if (profile.role === "personal") {
          navigate("/personal/dashboard");
        } else {
          navigate("/aluno/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Entre na sua conta Atrenis</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionExpired && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Sessão Expirada</AlertTitle>
              <AlertDescription>
                Sua sessão expirou por inatividade. Por favor, faça login novamente.
              </AlertDescription>
            </Alert>
          )}
          {accountDeactivated && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Conta Desativada</AlertTitle>
              <AlertDescription>
                Sua conta foi desativada. Por favor, entre em contato com seu personal trainer.
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} disabled={isLoading} />
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
                      <Input type="password" placeholder="••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <Label>Manter conectado</Label>
                      </div>
                    </FormItem>
                  )}
                />
                <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground mt-4">
                Aluno? Use o email e senha fornecidos pelo seu personal trainer.
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Não tem uma conta?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  Cadastre-se como Personal Trainer
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}