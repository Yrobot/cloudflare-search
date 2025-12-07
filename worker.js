import { env, setEnv } from "./envs.js";
import { getSearchHtml } from "./utils/getHTML.js";
import searchGoogle from "./utils/searchGoogle.js";
import searchBrave from "./utils/searchBrave.js";
import searchDuckDuckGo from "./utils/searchDuckDuckGo.js";
import searchBing from "./utils/searchBing.js";

const SEARCH_ENGINES = {
  google: searchGoogle,
  brave: searchBrave,
  duckduckgo: searchDuckDuckGo,
  bing: searchBing,
};

/**
 * Parse engines parameter
 * @param {string|undefined} enginesParam - Comma-separated engine names
 * @returns {string[]} Array of valid engine names
 */
function parseEngines(enginesParam) {
  if (!enginesParam) return env.DEFAULT_ENGINES || env.SUPPORTED_ENGINES;

  return enginesParam
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => {
      // Filter out google if not enabled
      if (e === "google" && !(env.GOOGLE_API_KEY && env.GOOGLE_CX))
        return false;
      return env.SUPPORTED_ENGINES.includes(e);
    });
}

/**
 * Search with a single engine
 * @param {string} engineName - Engine name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
async function searchSingle(engineName, query) {
  const searchFn = SEARCH_ENGINES[engineName];
  if (!searchFn) {
    console.warn(`Unknown engine: ${engineName}`);
    return [];
  }

  // 创建 AbortController 用于取消请求
  const controller = new AbortController();
  const timeout = parseInt(env.DEFAULT_TIMEOUT ?? "3000", 10);

  try {
    // 设置超时自动取消
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const result = await searchFn({ query, signal: controller.signal });

    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error(`[${engineName}] Timeout after ${timeout}ms`);
    } else {
      console.error(`[${engineName}] Error:`, error.message);
    }
    return [];
  }
}

/**
 * Search with all specified engines in parallel
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string[]} [params.engines] - Array of engine names
 * @returns {Promise<Object>} Search response matching searchAll type
 */
async function searchAll({ query, engines }) {
  const enabledEngines = parseEngines(engines?.join(","));

  console.log(`[searchAll] query="${query}", engines=[${enabledEngines}]`);

  // Execute all searches in parallel
  const resultsArr = await Promise.allSettled(
    enabledEngines.map((engine) => searchSingle(engine, query))
  );

  // Collect resultsArr and track unresponsive engines
  const results = [];
  const unresponsive = [];

  resultsArr.forEach((result, index) => {
    const engineName = enabledEngines[index];
    if (result.status === "fulfilled" && result.value.length > 0) {
      results.push(
        ...result.value.map((item) => ({
          ...item,
          engine: engineName,
        }))
      );
    } else {
      unresponsive.push(engineName);
      if (result.status === "rejected") {
        console.error(`[${engineName}] Rejected:`, result.reason);
      }
    }
  });

  return {
    query,
    number_of_results: results.length,
    enabled_engines: enabledEngines,
    unresponsive_engines: unresponsive,
    results,
  };
}

/**
 * CORS headers
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

/**
 * Verify authentication token
 */
function verifyToken(request, paramToken) {
  // If TOKEN is not configured, skip authentication
  if (!env.TOKEN) {
    return true;
  }

  const token =
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ||
    paramToken;

  return token === env.TOKEN;
}

/**
 * Main request handler
 */
async function handleRequest(request) {
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // Only allow GET and POST
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  // Parse query parameters
  let params = {};
  if (request.method === "POST") {
    const formData = await request.formData();
    params = Object.fromEntries(formData.entries());
  } else {
    params = Object.fromEntries(url.searchParams.entries());
  }

  // Verify authentication token
  if (!verifyToken(request, params.token)) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Invalid or missing authentication token",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  }

  // Root path: return HTML UI
  if (url.pathname === "/") {
    return new Response(getSearchHtml(), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...CORS_HEADERS,
      },
    });
  }

  // /search path: handle API requests
  if (url.pathname === "/search") {
    const query = params.q || params.query;

    if (!query) {
      return new Response(
        JSON.stringify({
          error: "Missing query parameter",
          message: "Please provide 'q' or 'query' parameter",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Parse engines parameter (optional)
    const engines = params.engines?.split(",").filter(Boolean) || undefined;

    try {
      const response = await searchAll({ query, engines });

      return new Response(JSON.stringify(response, null, 2), {
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    } catch (error) {
      console.error("[handleRequest] Error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }
  }

  // 404 for other paths
  return new Response("Not Found", {
    status: 404,
    headers: CORS_HEADERS,
  });
}

export default {
  async fetch(request, env_param) {
    setEnv(env_param);
    return handleRequest(request);
  },
};
