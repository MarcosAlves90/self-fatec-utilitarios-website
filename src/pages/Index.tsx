import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradeCalculator } from "@/components/GradeCalculator";
import { RequiredScoreCalculator } from "@/components/RequiredScoreCalculator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Calculator, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <SEO
        title="Calculadora de Média"
        description="Calcule médias, veja seu status de aprovação e descubra a nota necessária para alcançar seus objetivos acadêmicos na Fatec Mauá."
        keywords="calculadora de média, Fatec Mauá, notas, aprovação, nota necessária"
        canonicalPath="/"
        type="website"
      />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Sistema de Cálculo de Médias
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              Calcule suas médias, verifique seu status de aprovação e descubra 
              qual nota você precisa para atingir seus objetivos acadêmicos.
            </p>

            <div className="mt-5">
              <Button asChild variant="outline">
                <Link to="/noticias">Ver notícias da Fatec Mauá</Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Calcular</span>
              </TabsTrigger>
              <TabsTrigger value="required" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Nota Necessária</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-4">
              <GradeCalculator />
            </TabsContent>

            <TabsContent value="required" className="space-y-4">
              <RequiredScoreCalculator />
            </TabsContent>
          </Tabs>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            <div className="p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <h3 className="font-semibold">Conceito A</h3>
              </div>
              <p className="text-2xl font-bold text-success">≥ 9.0</p>
              <p className="text-xs text-muted-foreground mt-1">Excelente</p>
            </div>

            <div className="p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <h3 className="font-semibold">Conceito B</h3>
              </div>
              <p className="text-2xl font-bold text-primary">≥ 7.0</p>
              <p className="text-xs text-muted-foreground mt-1">Bom</p>
            </div>

            <div className="p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-warning"></div>
                <h3 className="font-semibold">Aprovação</h3>
              </div>
              <p className="text-2xl font-bold text-warning">≥ 6.0</p>
              <p className="text-xs text-muted-foreground mt-1">Média mínima</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
