// Provides a DOMParser implementation that works both in the browser and
// on the server (Node). When running in Node we pull in jsdom lazily so the
// client bundle does not include it.

let DOMParserImpl: typeof DOMParser;

if (typeof window === "undefined") {
  // server side – require jsdom only when needed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { JSDOM } = require("jsdom");
  DOMParserImpl = new JSDOM("", { contentType: "text/html" }).window.DOMParser;
} else {
  // browser environment
  DOMParserImpl = DOMParser;
}

export default DOMParserImpl;
