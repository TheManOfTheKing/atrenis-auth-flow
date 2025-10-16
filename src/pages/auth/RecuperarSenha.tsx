import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const recuperarSchema = z.object({
  email: z.string().email("Email inválido"),
});

type RecuperarFormData = z.infer<typeof recuperarSchema>;

export default function RecuperarSenha() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<RecuperarFormData>({
    resolver: zodResolver(recuperarSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: RecuperarFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
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
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Email enviado com sucesso!" 
              : "Digite seu email para receber o link de recuperação"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para seu email. Clique no link para redefinir sua senha.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Voltar para o login
                </Button>
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>

                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    Voltar para o login
                  </Button>
                </Link>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
