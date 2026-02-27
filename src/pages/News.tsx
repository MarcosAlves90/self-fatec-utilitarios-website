import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ExternalLink, Loader2, Newspaper } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { ArinterNewsScraper } from "@/utils/arinterNewsScraper";
import { FatecNewsScraper } from "@/utils/fatecNewsScraper";

export type NewsSource = "fatec" | "arinter";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";

// helper that returns a new scraper instance for chosen source
const createScraper = (source: NewsSource) => {
  return source === "arinter" ? new ArinterNewsScraper() : new FatecNewsScraper();
};

const formatDate = (value?: string): string | null => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
};

type PaginationToken = number | "ellipsis";

const buildPaginationTokens = (currentPage: number, totalPages: number): PaginationToken[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  for (let offset = 2; pages.size < 7; offset += 1) {
    if (currentPage - offset > 1) pages.add(currentPage - offset);
    if (currentPage + offset < totalPages) pages.add(currentPage + offset);
    if (currentPage - offset <= 1 && currentPage + offset >= totalPages) break;
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const tokens: PaginationToken[] = [];
  sortedPages.forEach((page, index) => {
    tokens.push(page);

    const nextPage = sortedPages[index + 1];
    if (nextPage && nextPage - page > 1) {
      tokens.push("ellipsis");
    }
  });

  return tokens;
};

const News = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const initialSource =
    (searchParams.get("source") === "arinter" ? "arinter" : "fatec") as NewsSource;
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [source, setSource] = useState<NewsSource>(initialSource);
  const isMobile = useIsMobile();

  // sync params whenever source or page updates
  useEffect(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", currentPage.toString());
      params.set("source", source);
      return params;
    });
  }, [currentPage, source, setSearchParams]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["news-page", source, currentPage],
    queryFn: () => createScraper(source).scrapePage(currentPage),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });

  const totalPages = data?.detectedTotalPages ?? 1;

  const paginationTokens = useMemo(
    () => buildPaginationTokens(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const goToPage = (page: number) => {
    const safePage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(safePage);
    // search params effect handles updating query
  };

  const renderPagination = () => (
    <Pagination className="w-full">
      <PaginationContent
        className="flex-wrap justify-center gap-2"
        aria-busy={isFetching}
        aria-live="polite"
      >
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault();
              if (isFetching) return;
              if (currentPage > 1) goToPage(currentPage - 1);
            }}
            className={currentPage <= 1 || isFetching ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>

        {isMobile ? (
          <PaginationItem>
            <span className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium">
              Página {currentPage} de {totalPages}
            </span>
          </PaginationItem>
        ) : (
          paginationTokens.map((token, index) => (
            <PaginationItem key={`${token}-${index}`}>
              {token === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  isActive={token === currentPage}
                  onClick={(event) => {
                    event.preventDefault();
                    if (isFetching) return;
                    goToPage(token);
                  }}
                >
                  {token}
                </PaginationLink>
              )}
            </PaginationItem>
          ))
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(event) => {
              event.preventDefault();
              if (isFetching) return;
              if (currentPage < totalPages) goToPage(currentPage + 1);
            }}
            className={currentPage >= totalPages || isFetching ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <SEO
        title="Notícias da Fatec Mauá"
        description="Acompanhe as notícias oficiais da Fatec Mauá em uma visualização rápida e organizada, com paginação e leitura completa das publicações."
        keywords="notícias Fatec Mauá, comunicados Fatec, eventos Fatec"
        canonicalPath="/noticias"
        type="website"
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <section className="text-center animate-fade-in space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
                <Newspaper className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Portal de Notícias</span>
              </div>

              <div>
                <label className="text-sm mr-2">Fonte:</label>
                <select
                  value={source}
                  onChange={(e) => {
                    const val = e.target.value as NewsSource;
                    setSource(val);
                    setCurrentPage(1);
                  }}
                  className="rounded-md border px-2 py-1"
                >
                  <option value="fatec">Fatec Mauá</option>
                  <option value="arinter">ARInter</option>
                </select>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {source === "fatec" ? "Notícias da Fatec Mauá" : "Notícias da ARInter"}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-3xl mx-auto">
              {source === "fatec"
                ? "Visualizador de notícias baseado no portal oficial da Fatec Mauá, extraindo título, link e descrição de cada publicação."
                : "Coletor de publicações do site da ARInter (Assessoria de Relações Internacionais)."}
            </p>
          </section>

          {isError ? (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Não foi possível carregar as notícias</CardTitle>
                <CardDescription>
                  {error instanceof Error
                    ? error.message
                    : "Ocorreu um erro inesperado ao acessar o portal de notícias."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {isLoading ? (
            <section className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={`skeleton-${index}`}> 
                  <div className="flex flex-col md:flex-row">
                    <Skeleton className="h-40 w-full md:w-48 rounded-t-md md:rounded-l-md md:rounded-tr-none" />
                    <div className="flex-1">
                      <CardHeader>
                        <Skeleton className="h-6 w-4/5" />
                        <Skeleton className="h-4 w-2/5" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-11/12" />
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          ) : null}

          {!isLoading && data && data.articles.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma notícia encontrada</CardTitle>
                <CardDescription>
                  Não identificamos artigos para esta página. Tente navegar para outra página.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!isLoading && data && data.articles.length > 0 ? (
            <section className="grid grid-cols-1 gap-4">
              {data.articles.map((article) => (
                <Card key={article.link} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    {/* exibe imagem se disponível, mantendo responsividade */}
                    {article.imageUrl ? (
                      <div className="w-full h-40 md:h-auto md:w-48 overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : null}

                    <div className="flex-1">
                      <CardHeader>
                        <CardTitle className="text-lg leading-snug">{article.title}</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>{formatDate(article.publishedAt) ?? "Data não informada"}</span>
                        </div>
                          </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {article.description || "Sem descrição disponível para este artigo."}
                        </p>

                        <Button asChild variant="outline">
                          <Link to={`/noticias/${createScraper(source).buildArticleSlug(article.link)}?page=${currentPage}&source=${source}`}>                            Abrir notícia
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          ) : null}

          {!isLoading && !isError && data ? renderPagination() : null}

          {!isLoading && isFetching ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando notícias da página {currentPage}...</span>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
