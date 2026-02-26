import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, ExternalLink, Newspaper } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FatecNewsScraper } from "@/utils/fatecNewsScraper";

const scraper = new FatecNewsScraper();

const formatDate = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
};

const NewsArticle = () => {
  const { slug } = useParams<{ slug: string }>();

  const sourceUrl = (() => {
    if (!slug) return "";

    try {
      return scraper.buildArticleUrlFromSlug(slug);
    } catch {
      return "";
    }
  })();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["fatec-news-article", sourceUrl],
    queryFn: () => scraper.scrapeArticle(sourceUrl),
    enabled: Boolean(sourceUrl),
    staleTime: 1000 * 60 * 10,
  });

  const formattedDate = formatDate(data?.publishedAt);
  const seoDescription = data
    ? data.contentHtml
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160)
    : "Leitura completa de uma notícia oficial da Fatec Mauá.";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <SEO
        title={data?.title ?? "Notícia da Fatec Mauá"}
        description={seoDescription || "Leitura completa de uma notícia oficial da Fatec Mauá."}
        canonicalPath={slug ? `/noticias/${slug}` : "/noticias"}
        type="article"
        keywords="notícia Fatec Mauá, comunicado acadêmico, eventos Fatec"
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Button asChild variant="ghost" className="-ml-2">
              <Link to="/noticias">
                <ArrowLeft className="h-4 w-4" />
                Voltar para notícias
              </Link>
            </Button>

            {sourceUrl ? (
              <Button asChild variant="outline" size="sm">
                <a href={sourceUrl} target="_blank" rel="noreferrer noopener">
                  Ver no site oficial
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>

          {!sourceUrl ? (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Notícia não encontrada</CardTitle>
                <CardDescription>
                  O slug da notícia é inválido ou não foi informado. Volte para a listagem e selecione um item.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {isLoading ? (
            <Card>
              <CardHeader className="space-y-3">
                <Skeleton className="h-8 w-4/5" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <Skeleton key={`article-line-${idx}`} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : null}

          {isError ? (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Falha ao carregar a notícia</CardTitle>
                <CardDescription>
                  {error instanceof Error
                    ? error.message
                    : "Não foi possível obter o conteúdo da notícia."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!isLoading && !isError && data ? (
            <article className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 w-fit mb-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">Notícia</span>
                  </div>

                  <CardTitle className="text-2xl md:text-3xl leading-tight">{data.title}</CardTitle>

                  {formattedDate ? (
                    <CardDescription className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formattedDate}
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.contentHtml ? (
                    <div
                      className="text-sm md:text-base leading-7 text-foreground/90 space-y-4
                      [&_p]:mb-4 [&_p]:leading-7 [&_p:empty]:hidden
                      [&_div:empty]:hidden [&_.news-table-wrapper]:my-5 [&_.news-table-wrapper]:overflow-x-auto
                      [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
                      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic
                      [&_a]:text-primary [&_a]:underline [&_a]:break-all
                      [&_img]:rounded-md [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4 [&_img]:mx-auto
                      [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse
                      [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left
                      [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2"
                      dangerouslySetInnerHTML={{ __html: data.contentHtml }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Não foi possível identificar blocos de conteúdo legíveis para esta notícia.
                    </p>
                  )}
                </CardContent>
              </Card>
            </article>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsArticle;
