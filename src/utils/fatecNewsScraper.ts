/**
 * Serviço de scraping de notícias da Fatec Mauá.
 *
 * Princípios adotados:
 * - SRP: classe dedicada apenas à obtenção e parsing de notícias.
 * - DIP: estratégia de fetch injetável para facilitar teste/substituição.
 */

export interface NewsArticle {
  title: string;
  link: string;
  description: string;
  /**
   * URL da imagem em destaque que aparece no card da listagem. Nem todas as
   * notícias possuem imagem, então este campo é opcional.
   */
  imageUrl?: string;
  publishedAt?: string;
  postId?: number;
}

export interface NewsPageData {
  articles: NewsArticle[];
  detectedTotalPages: number;
}

export interface NewsPageResult {
  articles: NewsArticle[];
  currentPage: number;
  detectedTotalPages: number;
}

export interface NewsArticleDetail {
  title: string;
  sourceUrl: string;
  publishedAt?: string;
  contentHtml: string;
}

export interface NewsScrapeResult {
  articles: NewsArticle[];
  requestedPages: number;
  detectedTotalPages: number;
}

export interface NewsFetcher {
  get(url: string, timeoutMs: number): Promise<string>;
}

const DEV_PROXY_BASE_URL = "/__fatec_proxy/noticias/";
const OFFICIAL_BASE_URL = "https://www.fatecmaua.com.br/noticias/";
const DEV_PROXY_ORIGIN = "/__fatec_proxy";
const OFFICIAL_ORIGIN = "https://www.fatecmaua.com.br";
const DEV_PROXY_API_ORIGIN = "/__fatec_proxy/wp-json/wp/v2";
const OFFICIAL_API_ORIGIN = "https://www.fatecmaua.com.br/wp-json/wp/v2";
const APP_PROXY_ENDPOINT = "/api/fatec-proxy?url=";

const DEFAULT_BASE_URL =
  import.meta.env.VITE_FATEC_NEWS_BASE_URL ??
  (import.meta.env.DEV ? DEV_PROXY_BASE_URL : OFFICIAL_BASE_URL);

export class BrowserNewsFetcher implements NewsFetcher {
  async get(url: string, timeoutMs: number): Promise<string> {
    const requestUrl = this.resolveRequestUrl(url);
    return this.fetchText(requestUrl, timeoutMs);
  }

  private resolveRequestUrl(url: string): string {
    if (import.meta.env.DEV) {
      return url;
    }

    if (url.startsWith(OFFICIAL_ORIGIN)) {
      return `${APP_PROXY_ENDPOINT}${encodeURIComponent(url)}`;
    }

    return url;
  }

  private async fetchText(url: string, timeoutMs: number): Promise<string> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Falha HTTP ${response.status} ao acessar ${url}`);
      }

      return response.text();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}

export class FatecNewsScraper {
  private readonly articleDateCache = new Map<string, string | undefined>();

  constructor(
    private readonly fetcher: NewsFetcher = new BrowserNewsFetcher(),
    private readonly baseUrl: string = DEFAULT_BASE_URL,
  ) {}

  async scrapePage(page = 1): Promise<NewsPageResult> {
    const safePage = Math.max(1, Math.floor(page));
    const url = this.buildPageUrl(safePage);
    const pageData = await this.scrapePageFromUrl(url);
    const enriched = await this.enrichArticles(pageData.articles);

    return {
      articles: enriched,
      currentPage: safePage,
      detectedTotalPages: pageData.detectedTotalPages,
    };
  }

  async scrapeArticle(sourceUrl: string): Promise<NewsArticleDetail> {
    const normalizedSourceUrl = this.normalizeSourceUrl(sourceUrl);
    const fetchUrl = this.resolveFetchUrlForArticle(normalizedSourceUrl);

    const html = await this.fetcher.get(fetchUrl, 15000);
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = this.extractText(doc.querySelector("h1.entry-title, h1"));
    const publishedAt = this.extractPublishedDate(doc);

    const contentRoot =
      doc.querySelector("article .entry-content") ||
      doc.querySelector("article .post-content") ||
      doc.querySelector(".entry-content") ||
      doc.querySelector(".post-content") ||
      doc.body;

    if (!title || !contentRoot) {
      throw new Error("Não foi possível extrair o conteúdo da notícia selecionada.");
    }

    const contentHtml = this.sanitizeAndNormalizeContent(contentRoot, normalizedSourceUrl);

    return {
      title,
      sourceUrl: normalizedSourceUrl,
      publishedAt,
      contentHtml,
    };
  }

  buildArticleSlug(sourceUrl: string): string {
    const normalizedSourceUrl = this.normalizeSourceUrl(sourceUrl);

    const pathnameParts = new URL(normalizedSourceUrl).pathname
      .split("/")
      .filter((part) => part.length > 0);

    const slug = pathnameParts[pathnameParts.length - 1] ?? "";
    if (!slug) {
      throw new Error("Não foi possível gerar o slug da notícia.");
    }

    return slug;
  }

  buildArticleUrlFromSlug(slug: string): string {
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, "");
    if (!cleanSlug) {
      throw new Error("Slug da notícia inválido.");
    }

    return `${OFFICIAL_ORIGIN}/${cleanSlug}/`;
  }

  async scrapePages(pages = 1): Promise<NewsScrapeResult> {
    const safePages = Math.max(1, Math.floor(pages));
    const allArticles: NewsArticle[] = [];
    let detectedTotalPages = 1;

    for (let pageNumber = 1; pageNumber <= safePages; pageNumber += 1) {
      const pageData = await this.scrapePage(pageNumber);

      detectedTotalPages = Math.max(detectedTotalPages, pageData.detectedTotalPages);
      allArticles.push(...pageData.articles);
    }

    return {
      articles: this.removeDuplicatesByLink(allArticles),
      requestedPages: safePages,
      detectedTotalPages,
    };
  }

  private buildPageUrl(page: number): string {
    const normalizedBaseUrl = this.baseUrl.trim().replace(/\/+$/, "");
    if (page <= 1) return `${normalizedBaseUrl}/`;
    return `${normalizedBaseUrl}/page/${page}/`;
  }

  private normalizeSourceUrl(sourceUrl: string): string {
    const trimmedUrl = sourceUrl.trim();
    if (!trimmedUrl) {
      throw new Error("URL da notícia inválida.");
    }

    try {
      return new URL(trimmedUrl, OFFICIAL_ORIGIN).toString();
    } catch {
      throw new Error("URL da notícia inválida.");
    }
  }

  private resolveFetchUrlForArticle(sourceUrl: string): string {
    if (import.meta.env.DEV && sourceUrl.startsWith(OFFICIAL_ORIGIN)) {
      return `${DEV_PROXY_ORIGIN}${sourceUrl.slice(OFFICIAL_ORIGIN.length)}`;
    }

    return sourceUrl;
  }

  private async scrapePageFromUrl(url: string): Promise<NewsPageData> {
    const html = await this.fetcher.get(url, 15000);
    const doc = new DOMParser().parseFromString(html, "text/html");

    const articleNodes = Array.from(doc.querySelectorAll("article"));
    const articles = articleNodes
      .map((articleNode) => this.parseArticle(articleNode))
      .filter((article): article is NewsArticle => Boolean(article));

    const detectedTotalPages = this.parseTotalPages(doc);

    return { articles, detectedTotalPages };
  }

  private parseArticle(articleElement: Element): NewsArticle | null {
    const heading = articleElement.querySelector("h2.entry-title");
    const title = heading?.textContent?.trim() ?? "";
    const link = (heading?.querySelector("a") as HTMLAnchorElement | null)?.href ?? "";
    const description =
      articleElement.querySelector("div.ast-excerpt-container")?.textContent?.trim() ?? "";
    const publishedAt =
      articleElement.querySelector("time.entry-date")?.getAttribute("datetime") ||
      this.extractText(articleElement.querySelector("time.entry-date")) ||
      undefined;
    const postId = this.extractPostId(articleElement);

    // tente extrair a primeira imagem encontrada dentro do elemento. muitas vezes
    // o WordPress coloca uma figura com `img` ou uma thumbnail no próprio
    // <article>. usamos URL absoluta para evitar caminhos relativos.
    let imageUrl: string | undefined;
    const imgEl = articleElement.querySelector("img");
    if (imgEl?.getAttribute("src")) {
      try {
        imageUrl = new URL(imgEl.getAttribute("src") || "", OFFICIAL_ORIGIN).toString();
      } catch {
        imageUrl = imgEl.getAttribute("src") || undefined;
      }
    }

    if (!title || !link) {
      return null;
    }

    return { title, link, description, publishedAt, postId, imageUrl };
  }

  /**
   * Preenche campos adicionais que não são fornecidos pela listagem da página.
   * Atualmente recupera a data e a imagem quando faltantes.
   */
  private async enrichArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
    const tasks = articles.map(async (article) => {
      let publishedAt = article.publishedAt;
      let imageUrl = article.imageUrl;

      if (publishedAt === undefined) {
        const cachedDate = this.articleDateCache.get(article.link);
        if (cachedDate !== undefined) {
          publishedAt = cachedDate;
        } else {
          publishedAt =
            (article.postId ? await this.fetchPublishedDateByPostId(article.postId) : undefined) ||
            (await this.fetchPublishedDateFromArticle(article.link));
          this.articleDateCache.set(article.link, publishedAt);
        }
      }

      if (!imageUrl) {
        // tentar extrair imagem diretamente do conteúdo do artigo.
        imageUrl = await this.fetchImageUrlFromArticle(article.link);
      }

      return { ...article, publishedAt, imageUrl };
    });

    return Promise.all(tasks);
  }

  private async fetchPublishedDateFromArticle(articleUrl: string): Promise<string | undefined> {
    try {
      const normalizedSourceUrl = this.normalizeSourceUrl(articleUrl);
      const fetchUrl = this.resolveFetchUrlForArticle(normalizedSourceUrl);
      const html = await this.fetcher.get(fetchUrl, 10000);
      const doc = new DOMParser().parseFromString(html, "text/html");

      return this.extractPublishedDate(doc);
    } catch {
      return undefined;
    }
  }

  /**
   * Tenta obter a primeira URL de imagem relevante dentro do artigo fornecido.
   */
  private async fetchImageUrlFromArticle(articleUrl: string): Promise<string | undefined> {
    try {
      const normalizedSourceUrl = this.normalizeSourceUrl(articleUrl);
      const fetchUrl = this.resolveFetchUrlForArticle(normalizedSourceUrl);
      const html = await this.fetcher.get(fetchUrl, 10000);
      const doc = new DOMParser().parseFromString(html, "text/html");

      // procurar primeiro <img> dentro do conteúdo da notícia, similar ao
      // que já fazemos quando sanitizamos o conteúdo completo.
      const contentRoot =
        doc.querySelector("article .entry-content") ||
        doc.querySelector("article .post-content") ||
        doc.querySelector(".entry-content") ||
        doc.querySelector(".post-content") ||
        doc.body;

      const img = contentRoot?.querySelector("img[src]") as HTMLImageElement | null;
      if (img && img.src) {
        try {
          return new URL(img.src, OFFICIAL_ORIGIN).toString();
        } catch {
          return img.src;
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private async fetchPublishedDateByPostId(postId: number): Promise<string | undefined> {
    if (!Number.isFinite(postId) || postId <= 0) {
      return undefined;
    }

    try {
      const apiBase = import.meta.env.DEV ? DEV_PROXY_API_ORIGIN : OFFICIAL_API_ORIGIN;
      const endpoint = `${apiBase}/posts/${postId}?_fields=date,date_gmt`;
      const responseText = await this.fetcher.get(endpoint, 8000);
      const payload = JSON.parse(responseText) as { date?: string; date_gmt?: string };

      return payload.date || payload.date_gmt || undefined;
    } catch {
      return undefined;
    }
  }

  private extractPublishedDate(doc: Document): string | undefined {
    const directDate =
      doc.querySelector("time.entry-date")?.getAttribute("datetime") ||
      this.extractText(doc.querySelector("time.entry-date")) ||
      this.extractText(doc.querySelector(".entry-meta .published")) ||
      this.extractText(doc.querySelector(".posted-on .published")) ||
      this.extractText(doc.querySelector(".entry-meta .published.updated"));

    if (directDate) {
      return directDate;
    }

    const entryMetaText = this.extractText(doc.querySelector(".entry-meta, .ast-blog-meta-container"));
    const brDate = entryMetaText.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0];
    if (brDate) {
      return brDate;
    }

    return undefined;
  }

  private extractPostId(articleElement: Element): number | undefined {
    const rawId = articleElement.getAttribute("id") ?? "";
    const match = rawId.match(/^post-(\d+)$/i);
    if (!match) {
      return undefined;
    }

    const parsedId = Number.parseInt(match[1], 10);
    return Number.isFinite(parsedId) ? parsedId : undefined;
  }

  private parseTotalPages(doc: Document): number {
    const pageNumbers = Array.from(doc.querySelectorAll(".page-numbers"))
      .map((node) => Number.parseInt(node.textContent?.trim() ?? "", 10))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (pageNumbers.length === 0) {
      return 1;
    }

    return Math.max(...pageNumbers);
  }

  private extractText(element: Element | null): string {
    return element?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }

  private sanitizeAndNormalizeContent(contentRoot: Element, sourceUrl: string): string {
    const clonedRoot = contentRoot.cloneNode(true) as Element;

    // Remove elementos potencialmente perigosos/inúteis para leitura.
    clonedRoot
      .querySelectorAll("script, style, noscript, iframe, object, embed, form, button, input, textarea, select")
      .forEach((element) => element.remove());

    // Remove blocos comuns de compartilhamento e navegação do WordPress.
    clonedRoot
      .querySelectorAll(
        ".sharedaddy, .sd-sharing-enabled, .addtoany_share_save_container, .heateor_sss_sharing_container, .post-navigation, .navigation.post-navigation, .entry-meta, .ast-post-nav, .jp-relatedposts, .comments-area",
      )
      .forEach((element) => element.remove());

    // Remove estilos inline e atributos de evento para manter layout limpo e seguro.
    clonedRoot.querySelectorAll("*").forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (name === "style" || name.startsWith("on")) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    // Normaliza links para URL absoluta e mantém comportamento seguro.
    clonedRoot.querySelectorAll("a[href]").forEach((element) => {
      const anchor = element as HTMLAnchorElement;
      const href = anchor.getAttribute("href") ?? "";
      if (!href) return;

      try {
        anchor.href = new URL(href, sourceUrl).toString();
      } catch {
        anchor.removeAttribute("href");
      }

      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noreferrer noopener");
    });

    // Normaliza imagens para URL absoluta e otimiza carregamento.
    clonedRoot.querySelectorAll("img[src]").forEach((element) => {
      const image = element as HTMLImageElement;
      const src = image.getAttribute("src") ?? "";
      if (!src) return;

      try {
        image.src = new URL(src, sourceUrl).toString();
      } catch {
        image.remove();
        return;
      }

      image.setAttribute("loading", "lazy");
      image.setAttribute("decoding", "async");

      if (!image.getAttribute("alt") || image.getAttribute("alt")?.trim() === "") {
        image.setAttribute("alt", "Imagem da notícia");
      }

      image.removeAttribute("width");
      image.removeAttribute("height");
    });

    // Ajusta tabelas para renderização responsiva.
    clonedRoot.querySelectorAll("table").forEach((tableElement) => {
      const table = tableElement as HTMLTableElement;
      if (table.parentElement?.classList.contains("news-table-wrapper")) {
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "news-table-wrapper";
      table.parentElement?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    this.removeSocialShareClusters(clonedRoot);
    this.removeShareParagraphs(clonedRoot);
    this.removeEmptyNodes(clonedRoot);
    this.compactBreakSequences(clonedRoot);

    const html = clonedRoot.innerHTML.trim();
    if (html.length > 0) {
      return html;
    }

    return this.buildFallbackHtmlFromText(contentRoot);
  }

  private buildFallbackHtmlFromText(contentRoot: Element): string {
    const rawText = contentRoot.textContent?.replace(/\u00a0/g, " ") ?? "";
    const normalizedText = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (normalizedText.length === 0) {
      return "";
    }

    return normalizedText.map((line) => `<p>${this.escapeHtml(line)}</p>`).join("");
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private removeShareParagraphs(root: Element): void {
    const candidates = Array.from(root.querySelectorAll("p, div, section"));

    for (const candidate of candidates) {
      const text = this.extractText(candidate).toLowerCase();
      if (!text) continue;

      if (text.startsWith("compartilhe") || text === "compartilhe") {
        candidate.remove();
      }
    }
  }

  private removeSocialShareClusters(root: Element): void {
    const socialPatterns = [
      "facebook.com/sharer",
      "linkedin.com/sharing",
      "twitter.com/intent",
      "x.com/intent",
      "api.whatsapp.com",
      "wa.me/",
      "t.me/share",
    ];

    const socialAnchors = Array.from(root.querySelectorAll("a[href]"))
      .filter((anchor) => {
        const href = (anchor as HTMLAnchorElement).getAttribute("href")?.toLowerCase() ?? "";
        return socialPatterns.some((pattern) => href.includes(pattern));
      });

    for (const anchor of socialAnchors) {
      const removableContainer = anchor.closest("p, div, section, ul, ol");
      if (!removableContainer) {
        anchor.remove();
        continue;
      }

      const hasOnlySocialLinks = Array.from(removableContainer.querySelectorAll("a[href]")).every((link) => {
        const href = (link as HTMLAnchorElement).getAttribute("href")?.toLowerCase() ?? "";
        return socialPatterns.some((pattern) => href.includes(pattern));
      });

      const normalizedText = this.extractText(removableContainer).toLowerCase();
      const looksLikeShareBlock = normalizedText.startsWith("compartilhe") || normalizedText.includes("facebook") || normalizedText.includes("linkedin") || normalizedText.includes("twitter") || normalizedText.includes("whatsapp");

      if (hasOnlySocialLinks || looksLikeShareBlock) {
        removableContainer.remove();
      } else {
        anchor.remove();
      }
    }
  }

  private removeEmptyNodes(root: Element): void {
    const nodes = Array.from(root.querySelectorAll("p, div, span, li, ul, ol, blockquote, figure, section"));

    for (const node of nodes.reverse()) {
      if (!this.hasMeaningfulContent(node)) {
        node.remove();
      }
    }
  }

  private hasMeaningfulContent(node: Element): boolean {
    const text = (node.textContent ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 0) {
      return true;
    }

    return Boolean(node.querySelector("img, video, table, iframe, pre, code, ul, ol, li"));
  }

  private compactBreakSequences(root: Element): void {
    let hasRepeatedBreak = true;

    while (hasRepeatedBreak) {
      const repeated = root.querySelector("br + br");
      if (!repeated) {
        hasRepeatedBreak = false;
      } else {
        repeated.remove();
      }
    }
  }

  private removeDuplicatesByLink(items: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    const deduped: NewsArticle[] = [];

    for (const item of items) {
      if (seen.has(item.link)) continue;
      seen.add(item.link);
      deduped.push(item);
    }

    return deduped;
  }
}
