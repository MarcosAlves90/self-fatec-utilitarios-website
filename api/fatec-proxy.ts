const ALLOWED_HOSTS = new Set([
  "www.fatecmaua.com.br",
  "fatecmaua.com.br",
  // for ARInter support
  "arinter.cps.sp.gov.br",
]);

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
};

export default async function handler(req: any, res: any) {
  // allow cross-origin access from any origin (frontend will call this)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const rawUrl = Array.isArray(req.query?.url) ? req.query.url[0] : req.query?.url;

  if (!rawUrl || typeof rawUrl !== "string") {
    res.status(400).json({ error: "Parâmetro obrigatório ausente: url" });
    return;
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "URL inválida." });
    return;
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    res.status(403).json({ error: "Host não permitido." });
    return;
  }

  try {
    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: DEFAULT_HEADERS,
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") ?? "text/plain; charset=utf-8";
    const responseBody = await upstream.text();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
    res.status(upstream.status).send(responseBody);
  } catch {
    res.status(502).json({ error: "Falha ao consultar o serviço remoto autorizados." });
  }
}
