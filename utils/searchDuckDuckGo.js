import { normalizeResults } from "./index.js";

/**
 * 从 HTML 响应中提取搜索结果
 * DuckDuckGo 的 HTML 版本更稳定，不容易被反爬虫机制拦截
 */
function extractResultsFromHTML(html) {
  const results = [];

  // 匹配搜索结果容器 - DuckDuckGo 使用 class="result" 的 div
  const resultRegex =
    /<div[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<div class="clear"><\/div>/gi;
  const matches = html.matchAll(resultRegex);

  for (const match of matches) {
    const resultHTML = match[1];

    // 提取标题 - 在 <h2 class="result__title"> 中
    const titleMatch = resultHTML.match(
      /<h2[^>]*class="result__title"[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>/i
    );
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    // 提取 URL - DuckDuckGo 使用重定向链接，格式为 //duckduckgo.com/l/?uddg=真实URL
    // 需要从 uddg 参数中解码真实 URL
    const linkMatch = resultHTML.match(
      /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)/i
    );

    let url = "";
    if (linkMatch) {
      try {
        // 解码 URL
        url = decodeURIComponent(linkMatch[1]);
      } catch (e) {
        console.error("[DuckDuckGo] Failed to decode URL:", e);
      }
    }

    // 提取描述 - 在 <a class="result__snippet"> 中
    const snippetMatch = resultHTML.match(
      /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    );
    const description = snippetMatch
      ? snippetMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    // 只添加有效的结果
    if (title && url && !url.startsWith("javascript:")) {
      results.push({
        title: decodeHTMLEntities(title),
        url: url,
        content: decodeHTMLEntities(description),
      });
    }
  }

  return results;
}

/**
 * 解码 HTML 实体
 */
function decodeHTMLEntities(text) {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, ""); // 移除任何剩余的 HTML 标签
}

/**
 * 搜索 DuckDuckGo
 * 使用 HTML 版本，更稳定且不容易被反爬虫机制拦截
 * @param {Object} params - 搜索参数
 * @param {string} params.query - 搜索关键词
 * @param {string} [params.language] - 语言设置
 * @param {string} [params.time_range] - 时间范围
 * @param {number} [params.pageno] - 页码 (默认: 0)
 * @returns {Promise<Array>} 搜索结果数组
 */
async function searchDuckDuckGo({ query, language, time_range, pageno, signal }) {
  try {
    if (!query) throw new Error("Query cannot be empty!");

    // 构建查询参数 - 使用 HTML 版本
    const queryParams = {
      q: query,
      kl: language === "zh" ? "cn-zh" : "wt-wt", // 语言/区域
      df: time_range || "", // 时间范围
      s: String((pageno || 0) * 30), // 偏移量
    };

    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value !== "")
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    // 使用 /html 端点
    const searchUrl = `https://html.duckduckgo.com/html/?${queryString}`;

    const response = await fetch(
      searchUrl,
      {
        signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          Referer: "https://duckduckgo.com/",
        },
      }
    );

    if (!response.ok) {
      console.error(`[DuckDuckGo] Search failed: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // 从 HTML 中提取结果
    const results = extractResultsFromHTML(html);

    if (results.length === 0) {
      console.log(`[DuckDuckGo] No results found for query: ${query}`);
      return [];
    }

    return normalizeResults(results);
  } catch (error) {
    console.error("[DuckDuckGo] Search error:", error.message);
    return [];
  }
}

export default searchDuckDuckGo;
