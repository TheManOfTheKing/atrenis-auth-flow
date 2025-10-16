import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dumbbell, 
  Users, 
  BarChart3, 
  ArrowRight, 
  Play, 
  Shield, 
  Globe, 
  Check,
  Menu,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Star // Adicionado import para o ícone Star
} from "lucide-react";
import { useState, useEffect } from "react"; // Adicionado useEffect
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Adicionado import para Avatar
import { supabase } from "@/integrations/supabase/client"; // Adicionado import para Supabase
import { toast } from "@/hooks/use-toast"; // Adicionado import para toast
import { usePlans } from "@/hooks/usePlans"; // Importar o hook usePlans
import { Skeleton } from "@/components/ui/skeleton"; // Importar Skeleton

const Index = () => {
  const [email, setEmail] = useState("");
  const { data: plans, isLoading: isLoadingPlans, error: plansError } = usePlans({ ativo: true, sortBy: 'preco_mensal_asc' });

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, digite seu email.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Este email já está cadastrado!",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Sucesso!",
          description: "Email cadastrado com sucesso! Em breve você receberá nossas novidades.",
        });
        setEmail(""); // Limpa o campo de email
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-white text-2xl font-bold">
              Atrenis
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection("beneficios")} className="text-white hover:text-primary-yellow transition-colors">
                Benefícios
              </button>
              <button onClick={() => scrollToSection("como-funciona")} className="text-white hover:text-primary-yellow transition-colors">
                Como Funciona
              </button>
              <button onClick={() => scrollToSection("planos")} className="text-white hover:text-primary-yellow transition-colors">
                Planos
              </button>
              <button onClick={() => scrollToSection("depoimentos")} className="text-white hover:text-primary-yellow transition-colors">
                Depoimentos
              </button>
              {/* Link para a página Sobre removido do cabeçalho */}
              <button onClick={() => scrollToSection("contato")} className="text-white hover:text-primary-yellow transition-colors">
                Contato
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {/* Botão "Entrar" - Mantido apenas um e estilizado */}
              <Link to="/login">
                <Button variant="outline" className="border-2 border-secondary-blue bg-transparent text-white hover:bg-secondary-blue hover:text-white hidden sm:inline-flex">
                  Entrar
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 font-bold">
                  Comece Agora
                </Button>
              </Link>
              <Button variant="ghost" className="md:hidden text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary-dark pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"> {/* Ajustado para responsividade */}
            {/* Left Column */}
            <div className="order-2 lg:order-1"> {/* Ajustado para responsividade */}
              <p className="text-primary-yellow text-sm font-semibold uppercase tracking-[0.2em] mb-4">
                SISTEMA COMPLETO DE GESTÃO
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6"> {/* Ajustado para responsividade */}
                <span className="text-primary-yellow">POTENCIALIZE</span>{" "}
                <span className="text-white">SEU NEGÓCIO</span>
                <br />
                <span className="text-primary-yellow">GERENCIE</span>{" "}
                <span className="text-white">SEUS ALUNOS</span>
                <br />
                <span className="text-primary-yellow">LUCRE</span>{" "}
                <span className="text-white">MUITO MAIS</span>
              </h1>
              <p className="text-lg text-gray-400 mb-8 max-w-2xl">
                Gerencie seus alunos, planos, agendamentos e finanças em uma única plataforma. 
                Ganhe tempo e aumente sua rentabilidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => scrollToSection("planos")}
                  className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 font-bold px-8 py-6 text-lg h-auto"
                >
                  Comece Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                {/* Botão "Como funciona" corrigido */}
                <Button 
                  onClick={() => scrollToSection("como-funciona")}
                  variant="outline" 
                  className="border-2 border-secondary-red text-white bg-transparent hover:bg-secondary-red hover:text-white px-8 py-6 text-lg h-auto"
                >
                  <Play className="mr-2 h-5 w-5" /> Como funciona
                </Button>
              </div>
            </div>

            {/* Right Column */}
            <div className="relative order-1 lg:order-2"> {/* Ajustado para responsividade */}
              <div className="bg-gradient-to-br from-secondary-blue/20 to-secondary-green/20 rounded-xl border-2 border-secondary-blue p-8 shadow-2xl shadow-secondary-blue/20">
                <img 
                  src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80" 
                  alt="Dashboard Preview" 
                  className="rounded-lg w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-dark py-16 px-4 border-t border-white/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <p className="text-6xl md:text-7xl font-black text-primary-yellow mb-2">500+</p>
              <p className="text-white text-lg">Personal Trainers</p>
            </div>
            <div>
              <p className="text-6xl md:text-7xl font-black text-primary-yellow mb-2">10k+</p>
              <p className="text-white text-lg">Alunos Gerenciados</p>
            </div>
            <div>
              <p className="text-6xl md:text-7xl font-black text-primary-yellow mb-2">97%</p>
              <p className="text-white text-lg">Taxa de Satisfação</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Como Funciona */}
      <section id="como-funciona" className="bg-white py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary-dark mb-4">Como Funciona</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A plataforma que simplifica o gerenciamento de seus alunos e maximiza seus resultados
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-secondary-blue mb-4" />
                <CardTitle className="text-2xl">Segurança</CardTitle>
                <CardDescription className="text-base">
                  Seus dados e de seus alunos protegidos com criptografia de ponta a ponta
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-secondary-blue mb-4" />
                <CardTitle className="text-2xl">Facilidade</CardTitle>
                <CardDescription className="text-base">
                  Interface intuitiva que qualquer personal trainer consegue utilizar
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-secondary-blue mb-4" />
                <CardTitle className="text-2xl">Analytics</CardTitle>
                <CardDescription className="text-base">
                  Acompanhe o progresso de seus alunos com métricas detalhadas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Globe className="h-12 w-12 text-secondary-blue mb-4" />
                <CardTitle className="text-2xl">Acessibilidade</CardTitle>
                <CardDescription className="text-base">
                  Acesse de qualquer dispositivo, a qualquer hora, em qualquer lugar
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Eleve sua Jornada Section */}
      <section id="beneficios" className="bg-primary-dark py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <p className="text-primary-yellow text-sm font-semibold uppercase tracking-[0.2em] mb-4">
                COMO FUNCIONA
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-primary-yellow">ELEVE</span>{" "}
                <span className="text-white">SUA JORNADA DE FITNESS</span>
                <br />
                <span className="text-white">JUNTO COM A GENTE</span>
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                O Atrenis foi construído para simplificar o dia a dia dos personal trainers, 
                automatizando processos burocráticos e permitindo que você foque no que 
                realmente importa: seus alunos e seu conhecimento técnico.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary-yellow flex items-center justify-center">
                      <span className="text-primary-dark font-bold text-xl">1</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-lg">Cadastre-se e configure seu perfil profissional</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary-yellow flex items-center justify-center">
                      <span className="text-primary-dark font-bold text-xl">2</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-lg">Cadastre seus alunos e crie planos personalizados</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary-yellow flex items-center justify-center">
                      <span className="text-primary-dark font-bold text-xl">3</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-lg">Gerencie agendamentos, treinos e pagamentos</p>
                  </div>
                </div>
              </div>

              <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 font-bold px-8 py-6 text-lg h-auto">
                Comece gratuitamente
              </Button>
            </div>

            {/* Right Column */}
            <div className="relative">
              <div className="rounded-xl border-2 border-secondary-green overflow-hidden shadow-2xl shadow-secondary-green/20">
                <img 
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" 
                  alt="Personal Trainer" 
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="bg-primary-dark py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary-yellow text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              PLANOS
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-primary-yellow">ESCOLHA O</span>{" "}
              <span className="text-white">MELHOR PLANO</span>
              <br />
              <span className="text-white">PARA SEU NEGÓCIO</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Oferecemos planos flexíveis que se adaptam ao seu ritmo de crescimento. 
              Comece pequeno e escale conforme sua base de clientes cresce.
            </p>
          </div>

          {isLoadingPlans ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-gray-800 border-none text-white">
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <Skeleton className="h-12 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
                    </div>
                    <Skeleton className="h-10 w-full mt-6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plansError ? (
            <p className="text-destructive text-center">Erro ao carregar planos: {plansError.message}</p>
          ) : plans && plans.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={plan.id} className={`bg-gray-800 border-none text-white ${index === 1 ? 'border-2 border-primary-yellow relative' : ''}`}>
                  {index === 1 && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-yellow text-primary-dark font-bold">
                      MAIS POPULAR
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl mb-4">{plan.nome}</CardTitle>
                    <div>
                      <p className="text-6xl font-black mb-2">R${plan.preco_mensal.toFixed(2).replace('.', ',')}</p>
                      <p className="text-gray-400 text-sm">por mês</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {(plan.recursos as string[] || []).map((recurso, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-secondary-green" />
                          <span>{recurso}</span>
                        </div>
                      ))}
                      {plan.max_alunos !== null && (
                        <div className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-secondary-green" />
                          <span>Até {plan.max_alunos === 0 ? 'ilimitados' : plan.max_alunos} alunos</span>
                        </div>
                      )}
                    </div>
                    <Button variant={index === 1 ? 'default' : 'outline'} className={`w-full mt-6 ${index === 1 ? 'bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 font-bold' : 'border-white text-white bg-transparent hover:bg-white hover:text-primary-dark'}`}>
                      {index === 2 ? 'Contato' : 'Comece Agora'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Nenhum plano ativo encontrado.</p>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 bg-white px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-primary-dark"> {/* Alterado para text-primary-dark */}
            O Que Nossos <span className="text-primary-dark">Clientes</span> Dizem {/* Alterado para text-primary-dark */}
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Depoimentos reais de personal trainers que transformaram seus negócios
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Depoimento 1 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "O Atrenis revolucionou minha forma de trabalhar. Agora consigo gerenciar 
                  50 alunos com facilidade e ainda sobra tempo para focar no atendimento."
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>MC</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Maria Clara</p>
                    <p className="text-sm text-gray-500">Personal Trainer - SP</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 2 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "Aumentei minha receita em 40% no primeiro trimestre usando o Atrenis. 
                  A gestão financeira integrada fez toda a diferença!"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>RS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Roberto Silva</p>
                    <p className="text-sm text-gray-500">Personal Trainer - RJ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 3 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">
                  "Interface super intuitiva! Meus alunos adoram acompanhar os treinos 
                  pelo app. Profissionalismo total."
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>AF</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Ana Ferreira</p>
                    <p className="text-sm text-gray-500">Personal Trainer - MG</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter/CTA Section */}
      <section id="contato" className="bg-primary-dark py-20 px-4 border-t border-white/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary-yellow">JUNTE-SE</span>{" "}
            <span className="text-white">À NOSSA COMUNIDADE</span>
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Receba dicas exclusivas, novidades e conteúdos sobre gestão fitness
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <Input 
              type="email" 
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-none h-12"
            />
            <Button type="submit" className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 font-bold h-12 px-8">
              Inscrever-se
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-dark border-t border-white/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo e Descrição */}
            <div>
              <h3 className="text-white text-2xl font-bold mb-4">Atrenis</h3>
              <p className="text-gray-400 text-sm">
                Plataforma completa para Personal Trainers gerenciarem alunos e treinos.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-primary-yellow text-sm">Sobre</Link></li> {/* Link para a página Sobre */}
                <li><button onClick={() => scrollToSection("como-funciona")} className="text-gray-400 hover:text-primary-yellow text-sm">Funcionalidades</button></li>
                <li><button onClick={() => scrollToSection("planos")} className="text-gray-400 hover:text-primary-yellow text-sm">Preços</button></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">Blog</a></li> {/* Mantido como # para exemplo */}
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">FAQ</a></li> {/* Mantido como # para exemplo */}
                <li><button onClick={() => scrollToSection("contato")} className="text-gray-400 hover:text-primary-yellow text-sm">Contato</button></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">Termos de Uso</a></li> {/* Mantido como # para exemplo */}
                <li><a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">Privacidade</a></li> {/* Mantido como # para exemplo */}
              </ul>
            </div>

            {/* Redes Sociais */}
            <div>
              <h4 className="text-white font-semibold mb-4">Redes Sociais</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-primary-yellow">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-yellow">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-yellow">
                  <Linkedin className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-primary-yellow">
                  <Youtube className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <p className="text-gray-400 text-sm text-center">
              © 2025 Atrenis. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;