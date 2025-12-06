import { normalizeResults } from "./index.js";
import { env } from "../envs.js";

// type subSearch under index.d.ts
// TODO: support language, time_range, pageno
async function searchGoogle({ query, language, time_range, pageno, signal }) {
  const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${env.GOOGLE_API_KEY}&cx=${env.GOOGLE_CX}&q=${encodeURIComponent(
    query
  )}`;

  const response = await fetch(searchUrl, { signal });

  if (!response.ok) {
    console.error(await response.text());
    return [];
  }

  const data = await response.json();
  const results = [];

  if (data.items && Array.isArray(data.items)) {
    for (const item of data.items) {
      results.push({
        title: item.title,
        url: item.link,
        content: item.snippet || "",
      });
    }
  }

  return normalizeResults(results);
}

export default searchGoogle;
