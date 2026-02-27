import { ArinterNewsScraper } from "./arinterNewsScraper";
import { FatecNewsScraper } from "./fatecNewsScraper";

export type NewsSource = "fatec" | "arinter";

export const createScraper = (source: NewsSource) => {
  return source === "arinter" ? new ArinterNewsScraper() : new FatecNewsScraper();
};
