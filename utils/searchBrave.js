import { normalizeResults } from "./index.js";

// type subSearch under index.d.ts
// TODO: support language, time_range, pageno
async function searchBrave({ query, language, time_range, pageno, signal }) {
  const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(
    query
  )}&spellcheck=0&source=web&summary=0`;

  const response = await fetch(searchUrl, {
    signal,
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      priority: "u=0, i",
      "sec-ch-ua":
        '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie:
        "ui_lang=zh; country=all; safesearch=off; useLocation=0; __Secure-sku#brave-search-captcha=eyJ0eXBlIjoic2luZ2xlLXVzZSIsInZlcnNpb24iOjEsInNrdSI6ImJyYXZlLXNlYXJjaC1jYXB0Y2hhIiwicHJlc2VudGF0aW9uIjoiZXlKcGMzTjFaWElpT2lKaWNtRjJaUzVqYjIwL2MydDFQV0p5WVhabExYTmxZWEpqYUMxallYQjBZMmhoSWl3aWMybG5ibUYwZFhKbElqb2lPRFY2YVU1S1JVMXFTbXhvTTI5TE5UUXhTMFJtTlZkdU4yWjJiall2VmtVMVVHTmFkMlIzV2poMGFreDBTR0V2Tm1SVVMyVjRZWFpSZVVKSFNIcHRVR0ZLUWtSbVFUTkxlV3gzUjNaSVkyZ3ZUVXhvTTFFOVBTSXNJblFpT2lKM1dVZzJTVTFVTlRsTGMzRnpaM1ptTWpVMVRDOHpOVlZrYzFVNU1sRnlSSGxGZVdoWVlXSXdOa2x3TVhscU1HMUlUa0ozUjNGVVpYTlliWGh1TlVGREx5OXdLMUpJUjJzemJrTTJVWHBQWW1aUFpVOHlVVDA5SW4wPSJ9",
    },
    referrer: "https://search.brave.com/search?source=web",
  });

  if (!response.ok) {
    console.error(`Brave search failed: ${response.status}`);
    return [];
  }
  const html = await response.text();

  if (!html) throw new Error("html is empty");

  let data;

  html.split("\n").forEach((line) => {
    if (data) return;
    if (line.trimStart().startsWith(`data: [{type:"data",`)) {
      const pureLine = line.trim();
      const jsonStr = pureLine.slice(
        "data: ".length,
        pureLine.endsWith(",") ? -1 : undefined
      );
      data = eval("(" + jsonStr + ")");
    }
  });

  if (!data) throw new Error("can't find data in html");

  let result;

  data.forEach((item) => {
    if (result) return;
    if (item?.data?.body?.response?.web?.results)
      result = normalizeResults(item.data.body.response.web.results);
  });

  if (!result) throw new Error("can't find result in data");
  if (!(result instanceof Array)) throw new Error("result is not an array");

  return result;
}

export default searchBrave;
