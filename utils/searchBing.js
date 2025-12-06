import { normalizeResults } from "./index.js";

/**
 * Extract real URL from Bing redirect URL
 * Bing uses URLs like https://www.bing.com/ck/a?...&u=a1<base64>...
 * The 'u' parameter contains 'a1' + base64 encoded real URL
 */
function extractRealUrl(bingUrl) {
  // Return as-is if not a Bing redirect URL
  if (!bingUrl.includes("bing.com/ck/a?")) {
    return bingUrl;
  }

  try {
    // HTML entities like &amp; need to be decoded first
    const decodedUrl = bingUrl.replace(/&amp;/g, "&");
    const url = new URL(decodedUrl);
    const uParam = url.searchParams.get("u");

    if (!uParam) {
      return bingUrl;
    }

    // The 'u' parameter starts with 'a1' followed by base64 encoded URL
    if (uParam.startsWith("a1")) {
      const base64Part = uParam.substring(2); // Remove 'a1' prefix

      // Decode from base64 (use Buffer in Node.js, atob in browser)
      const decoded =
        typeof Buffer !== "undefined"
          ? Buffer.from(base64Part, "base64").toString("utf-8")
          : atob(base64Part);

      return decoded;
    }

    return bingUrl;
  } catch (error) {
    // If extraction fails, return original URL
    return bingUrl;
  }
}

// type subSearch under index.d.ts
// TODO: support language, time_range, pageno
async function searchBing({ query, language, time_range, pageno, signal }) {
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(
    query
  )}&form=QBLH&sp=-1&lq=0&pq=&sc=0-0&qs=n&sk=&cvid=&ghsh=0&ghacc=0&ghpl=`;

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
    },
  });

  if (!response.ok) {
    console.error(`Bing search failed: ${response.status}`);
    return [];
  }

  const html = await response.text();

  if (!html) throw new Error("html is empty");

  const results = [];

  // Parse Bing search results from HTML
  // Bing uses <li class="b_algo"> for organic search results
  // Updated regex to match current Bing HTML structure where <h2> and <a> are siblings
  const resultRegex =
    /<li class="b_algo"[^>]*>[\s\S]*?<h2[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>[\s\S]*?<div class="b_caption"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g;

  let match;
  while ((match = resultRegex.exec(html)) !== null) {
    let url = match[1];
    // Remove HTML tags from title
    const title = match[2].replace(/<[^>]+>/g, "");
    // Remove HTML tags from description
    const description = match[3].replace(/<[^>]+>/g, "");

    // Extract real URL from Bing redirect URL
    url = extractRealUrl(url);

    results.push({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
    });
  }

  if (results.length === 0) {
    throw new Error("can't find results in html");
  }

  return normalizeResults(results);
}

export default searchBing;
