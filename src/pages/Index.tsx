import { Footer } from "@/components/Footer";
import { GradeCalculator } from "@/components/GradeCalculator";
import { Header } from "@/components/Header";
import { RequiredScoreCalculator } from "@/components/RequiredScoreCalculator";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Target } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <SEO
        title="Calculadora de Media"
        description="Calcule medias, verifique aprovacao e descubra a nota necessaria para atingir sua meta academica na Fatec Maua."
        keywords="calculadora de media, Fatec Maua, notas, aprovacao, nota necessaria"
        canonicalPath="/"
        type="website"
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Sistema de Calculo de Medias
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              Calcule suas medias, verifique seu status de aprovacao e descubra
              qual nota voce precisa para atingir seus objetivos academicos.
            </p>
          </div>

          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Calcular</span>
              </TabsTrigger>
              <TabsTrigger value="required" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Nota Necessaria</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-4">
              <GradeCalculator />
            </TabsContent>

            <TabsContent value="required" className="space-y-4">
              <RequiredScoreCalculator />
            </TabsContent>
          </Tabs>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 animate-fade-in">
            <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <h3 className="font-semibold">Conceito A</h3>
              </div>
              <p className="text-2xl font-bold text-success">{"\u2265"} 9.0</p>
              <p className="mt-1 text-xs text-muted-foreground">Excelente</p>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <h3 className="font-semibold">Conceito B</h3>
              </div>
              <p className="text-2xl font-bold text-primary">{"\u2265"} 7.0</p>
              <p className="mt-1 text-xs text-muted-foreground">Bom</p>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning"></div>
                <h3 className="font-semibold">Aprovacao</h3>
              </div>
              <p className="text-2xl font-bold text-warning">{"\u2265"} 6.0</p>
              <p className="mt-1 text-xs text-muted-foreground">Media minima</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
