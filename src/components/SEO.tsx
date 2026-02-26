import { useEffect } from "react";

type SEOProps = {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  image?: string;
  robots?: string;
  type?: "website" | "article";
};

const ensureMetaTag = (selector: string, attributes: Record<string, string>): HTMLMetaElement => {
  let meta = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => meta?.setAttribute(key, value));
    document.head.appendChild(meta);
  }

  return meta;
};

const ensureLinkTag = (selector: string, attributes: Record<string, string>): HTMLLinkElement => {
  let link = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    Object.entries(attributes).forEach(([key, value]) => link?.setAttribute(key, value));
    document.head.appendChild(link);
  }

  return link;
};

export function SEO({
  title,
  description,
  keywords,
  canonicalPath,
  image,
  robots = "index, follow",
  type = "website",
}: SEOProps) {
  useEffect(() => {
    const siteName = "Utilitários Fatec Mauá";
    const normalizedTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

    const canonicalUrl = (() => {
      if (!canonicalPath) {
        return window.location.href;
      }

      try {
        return new URL(canonicalPath, window.location.origin).toString();
      } catch {
        return window.location.href;
      }
    })();

    const defaultImage = `${window.location.origin}/favicon.ico`;
    const ogImage = image ?? defaultImage;

    document.title = normalizedTitle;

    ensureMetaTag("meta[name='description']", { name: "description" }).setAttribute("content", description);
    ensureMetaTag("meta[name='robots']", { name: "robots" }).setAttribute("content", robots);

    if (keywords) {
      ensureMetaTag("meta[name='keywords']", { name: "keywords" }).setAttribute("content", keywords);
    }

    ensureMetaTag("meta[property='og:title']", { property: "og:title" }).setAttribute("content", normalizedTitle);
    ensureMetaTag("meta[property='og:description']", { property: "og:description" }).setAttribute("content", description);
    ensureMetaTag("meta[property='og:type']", { property: "og:type" }).setAttribute("content", type);
    ensureMetaTag("meta[property='og:url']", { property: "og:url" }).setAttribute("content", canonicalUrl);
    ensureMetaTag("meta[property='og:image']", { property: "og:image" }).setAttribute("content", ogImage);

    ensureMetaTag("meta[name='twitter:card']", { name: "twitter:card" }).setAttribute("content", "summary_large_image");
    ensureMetaTag("meta[name='twitter:title']", { name: "twitter:title" }).setAttribute("content", normalizedTitle);
    ensureMetaTag("meta[name='twitter:description']", { name: "twitter:description" }).setAttribute("content", description);
    ensureMetaTag("meta[name='twitter:image']", { name: "twitter:image" }).setAttribute("content", ogImage);

    ensureLinkTag("link[rel='canonical']", { rel: "canonical" }).setAttribute("href", canonicalUrl);
  }, [canonicalPath, description, image, keywords, robots, title, type]);

  return null;
}
