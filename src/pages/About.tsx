import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Lightbulb, Handshake, ArrowRight } from "lucide-react";
import { useEffect } from "react"; // Import useEffect

export default function About() {
  useEffect(() => {
    console.log("About page rendered!"); // Log para depuração
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-primary-dark py-20 md:py-32 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            Sobre a <span className="text-primary-yellow">Atrenis</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8">
            Nossa missão é empoderar personal trainers, simplificando a gestão de seus negócios e maximizando seu impacto no mundo do fitness.
          </p>
          <Link to="/signup">
            <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 font-bold px-8 py-6 text-lg h-auto">
              Comece Sua Jornada <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-dark mb-6">
              Nossa <span className="text-secondary-blue">Missão</span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              A Atrenis nasceu da paixão por transformar vidas através do exercício físico e do reconhecimento da necessidade de ferramentas eficientes para os profissionais da área. Nossa missão é fornecer uma plataforma intuitiva e completa que automatize tarefas administrativas, liberando o tempo dos personal trainers para que possam focar no que fazem de melhor: treinar, motivar e inspirar seus alunos.
            </p>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-dark mb-6">
              Nossa <span className="text-secondary-green">Visão</span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Almejamos ser a plataforma líder global em gestão para personal trainers, reconhecida pela inovação, confiabilidade e pelo impacto positivo que geramos na comunidade fitness. Queremos construir um futuro onde cada personal trainer tenha as ferramentas necessárias para prosperar e cada aluno alcance seu potencial máximo.
            </p>
          </div>
        </div>
      </section>

      {/* Why Atrenis Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-dark mb-12">
            Por Que Escolher a <span className="text-primary-yellow">Atrenis</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-col items-center">
                <Target className="h-12 w-12 text-primary-yellow mb-4" />
                <CardTitle className="text-xl font-semibold text-primary-dark">Foco no Seu Negócio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatize a burocracia e dedique mais tempo aos seus alunos e ao desenvolvimento de treinos inovadores.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-col items-center">
                <Lightbulb className="h-12 w-12 text-secondary-blue mb-4" />
                <CardTitle className="text-xl font-semibold text-primary-dark">Inovação Constante</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Estamos sempre evoluindo, trazendo as melhores e mais recentes tecnologias para otimizar sua gestão.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-col items-center">
                <Handshake className="h-12 w-12 text-secondary-green mb-4" />
                <CardTitle className="text-xl font-semibold text-primary-dark">Parceria e Suporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Conte com uma equipe dedicada para te ajudar a tirar o máximo proveito da plataforma.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary-dark py-16 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para Transformar Seu Negócio?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Junte-se a centenas de personal trainers que já estão elevando sua carreira com a Atrenis.
          </p>
          <Link to="/signup">
            <Button className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 font-bold px-8 py-6 text-lg h-auto">
              Comece Agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}