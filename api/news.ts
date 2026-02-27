import type { NextApiRequest, NextApiResponse } from "next";
import { FatecNewsScraper } from "../src/utils/fatecNewsScraper";
import { ArinterNewsScraper } from "../src/utils/arinterNewsScraper";

// keep cache in memory; simple Map with TTL
interface CacheEntry {
  data: any;
  expires: number;
}
const pageCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const scrapers = {
  fatec: new FatecNewsScraper(),
  arinter: new ArinterNewsScraper(),
};

type NewsSource = "fatec" | "arinter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page, source = "fatec", url } = req.query;
  const src = source === "arinter" ? "arinter" : "fatec" as NewsSource;
  const now = Date.now();

  if (typeof url === "string" && url) {
    // article detail request
    const cacheKey = `article:${src}:${url}`;
    const cached = pageCache.get(cacheKey);
    if (cached && cached.expires > now) {
      res.setHeader("x-cache", "HIT");
      res.status(200).json(cached.data);
      return;
    }
    try {
      const result = await scrapers[src].scrapeArticle(url);
      pageCache.set(cacheKey, { data: result, expires: now + CACHE_TTL });
      res.setHeader("x-cache", "MISS");
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message || "Erro interno" });
    }
    return;
  }

  // page list request
  const pageNum = Math.max(1, Math.floor(Number(page) || 1));
  const cacheKey = `${src}:${pageNum}`;
  const cached = pageCache.get(cacheKey);
  if (cached && cached.expires > now) {
    res.setHeader("x-cache", "HIT");
    res.status(200).json(cached.data);
    return;
  }

  try {
    const result = await scrapers[src].scrapePage(pageNum);
    pageCache.set(cacheKey, { data: result, expires: now + CACHE_TTL });
    res.setHeader("x-cache", "MISS");
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message || "Erro interno" });
  }
}
