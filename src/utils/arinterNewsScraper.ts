import { NewsArticle, NewsPageResult, NewsFetcher } from "./fatecNewsScraper";

import DOMParserImpl from "./domParser";

// base URL configurable via env; in dev we proxy through vite server
const OFFICIAL_ORIGIN = "https://arinter.cps.sp.gov.br";
const DEV_PROXY_BASE_URL = "/__arinter_proxy";

const DEFAULT_BASE_URL =
  import.meta.env.VITE_ARINTER_NEWS_BASE_URL ??
  (import.meta.env.DEV ? DEV_PROXY_BASE_URL : OFFICIAL_ORIGIN);

export class ArinterNewsScraper {
  // reuse DOMParser polyfill from fatec scraper if available
  constructor(
    private readonly fetcher: NewsFetcher = new (class implements NewsFetcher {
      async get(url: string, timeoutMs: number): Promise<string> {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(url, { method: "GET", signal: controller.signal });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ao acessar ${url}`);
          }
          return response.text();
        } finally {
          window.clearTimeout(timeoutId);
        }
      }
    })(),
    private readonly baseUrl: string = DEFAULT_BASE_URL,
  ) {}

  async scrapePage(page = 1): Promise<NewsPageResult> {
    const safePage = Math.max(1, Math.floor(page));
    const url = this.buildPageUrl(safePage);
    const fetchUrl = this.resolveFetchUrl(url);
    const html = await this.fetcher.get(fetchUrl, 15000);
    const doc = new DOMParserImpl().parseFromString(html, "text/html");

    const items = Array.from(doc.querySelectorAll(".listagem-posts-item"));
    const articles = items
      .map((item) => this.parseListItem(item))
      .filter((a): a is NewsArticle => Boolean(a));

    const detectedTotalPages = this.parseTotalPages(doc);

    return { articles, detectedTotalPages, currentPage: safePage };
  }

  async scrapeArticle(sourceUrl: string) {
    const normalized = this.normalizeSourceUrl(sourceUrl);
    const fetchUrl = this.resolveFetchUrlForArticle(normalized);
    const html = await this.fetcher.get(fetchUrl, 15000);
    const doc = new DOMParserImpl().parseFromString(html, "text/html");

    const title = doc.querySelector("h1.title-interna")?.textContent?.trim() || "";
    const publishedAt =
      doc.querySelector("meta[property=\"article:published_time\"]")?.getAttribute("content") ||
      undefined;

    const contentRoot = doc.querySelector(".cps-texto-conteudo");
    if (contentRoot) {
      // convert lazy images to regular src so they render client-side
      contentRoot.querySelectorAll("img[data-lazy-src]").forEach((img) => {
        const src = img.getAttribute("data-lazy-src");
        if (src) img.setAttribute("src", src);
      });
    }
    const contentHtml = contentRoot ? contentRoot.innerHTML : "";

    if (!title) {
      throw new Error("Não foi possível extrair o conteúdo da notícia selecionada.");
    }

    return { title, sourceUrl: normalized, publishedAt, contentHtml };
  }

  buildArticleSlug(sourceUrl: string): string {
    const normalized = this.normalizeSourceUrl(sourceUrl);
    const pathnameParts = new URL(normalized).pathname
      .split("/")
      .filter((part) => part.length > 0);
    const slug = pathnameParts[pathnameParts.length - 1] || "";
    if (!slug) throw new Error("Não foi possível gerar o slug da notícia.");
    return slug;
  }

  buildArticleUrlFromSlug(slug: string): string {
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, "");
    if (!cleanSlug) throw new Error("Slug da notícia inválido.");
    return `${this.baseUrl.replace(/\/+$/, "")}/${cleanSlug}/`;
  }

  private normalizeSourceUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) throw new Error("URL da notícia inválida.");
    try {
      return new URL(trimmed, OFFICIAL_ORIGIN).toString();
    } catch {
      throw new Error("URL da notícia inválida.");
    }
  }

  // in dev, proxy through vite; in prod, send to serverless proxy
  private resolveFetchUrl(url: string): string {
    if (import.meta.env.DEV && url.startsWith(OFFICIAL_ORIGIN)) {
      return `${DEV_PROXY_BASE_URL}${url.slice(OFFICIAL_ORIGIN.length)}`;
    }
    if (!import.meta.env.DEV && url.startsWith(OFFICIAL_ORIGIN)) {
      return `/api/fatec-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  private resolveFetchUrlForArticle(sourceUrl: string): string {
    if (import.meta.env.DEV && sourceUrl.startsWith(OFFICIAL_ORIGIN)) {
      return `${DEV_PROXY_BASE_URL}${sourceUrl.slice(OFFICIAL_ORIGIN.length)}`;
    }
    // in production we use same API proxy that fatec scraper uses
    if (!import.meta.env.DEV && sourceUrl.startsWith(OFFICIAL_ORIGIN)) {
      return `/api/fatec-proxy?url=${encodeURIComponent(sourceUrl)}`;
    }
    return sourceUrl;
  }

  private buildPageUrl(page: number): string {
    const normalizedBase = this.baseUrl.trim().replace(/\/+$/, "");
    if (page <= 1) return `${normalizedBase}/?post_type=post`;
    return `${normalizedBase}/page/${page}/?post_type=post`;
  }

  private parseListItem(item: Element): NewsArticle | null {
    const linkEl = item.querySelector("a.listagem-posts-img") as HTMLAnchorElement | null;
    const link = linkEl?.href || "";
    if (!link) return null;

    const title = item.querySelector(".listagem-posts-titulo")?.textContent?.trim() || "";
    const description = item
      .querySelector(".listagem-posts-resumo")
      ?.textContent?.trim() ||
      "";
    const publishedAt =
      item.querySelector(".listagem-posts-date")?.textContent?.trim() ||
      undefined;
    const imgEl = item.querySelector("a.listagem-posts-img img") as HTMLImageElement | null;
    let imageUrl: string | undefined;
    if (imgEl) {
      imageUrl = imgEl.getAttribute("data-lazy-src") || imgEl.src || undefined;
      if (imageUrl) {
        try {
          imageUrl = new URL(imageUrl, this.baseUrl).toString();
        } catch {
          // ignore invalid URL
        }
      }
    }

    return { title, link, description, publishedAt, imageUrl };
  }

  private parseTotalPages(doc: Document): number {
    const nav = doc.querySelector("nav.navigation.pagination");
    if (!nav) return 1;
    const numbers = Array.from(nav.querySelectorAll(".page-numbers"))
      .map((el) => parseInt(el.textContent || "", 10))
      .filter((n) => !Number.isNaN(n));
    if (numbers.length === 0) return 1;
    return Math.max(...numbers);
  }
}
