#!/usr/bin/env node

/**
 * Cloudflare Search MCP Server
 *
 * This MCP server provides access to the Cloudflare Search API,
 * allowing AI assistants to search across multiple search engines.
 *
 * Environment Variables:
 * - CF_SEARCH_URL: The URL of your Cloudflare Search Worker (required)
 * - CF_SEARCH_TOKEN: Authentication token for the search API (optional)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Get configuration from environment variables
const CF_SEARCH_URL = process.env.CF_SEARCH_URL;
const CF_SEARCH_TOKEN = process.env.CF_SEARCH_TOKEN;

if (!CF_SEARCH_URL) {
  console.error("Error: CF_SEARCH_URL environment variable is required");
  console.error("Example: export CF_SEARCH_URL=https://your-worker.workers.dev");
  process.exit(1);
}

/**
 * Call the Cloudflare Search API
 */
async function searchAPI(query, engines = null) {
  try {
    const params = new URLSearchParams({ q: query });

    if (engines && engines.length > 0) {
      params.append("engines", engines.join(","));
    }

    if (CF_SEARCH_TOKEN) {
      params.append("token", CF_SEARCH_TOKEN);
    }

    const url = `${CF_SEARCH_URL}/search?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to search: ${error.message}`);
  }
}

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: "cloudflare-search",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description:
          "Search across multiple search engines (Google, Brave, DuckDuckGo, Bing) and return aggregated results. " +
          "This tool provides comprehensive search results from multiple sources, with source attribution for each result.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query string",
            },
            engines: {
              type: "array",
              items: {
                type: "string",
                enum: ["google", "brave", "duckduckgo", "bing"],
              },
              description:
                "Optional: Array of search engines to use. If not specified, uses default engines. " +
                "Available engines: google, brave, duckduckgo, bing",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

/**
 * Handler for tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "search") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  if (!request.params.arguments) {
    throw new Error("Missing arguments");
  }

  const { query, engines } = request.params.arguments;

  if (!query || typeof query !== "string") {
    throw new Error("Query must be a non-empty string");
  }

  try {
    const result = await searchAPI(query, engines);

    // Format the results for better readability
    const formattedResults = result.results
      .map((item, index) => {
        return `${index + 1}. [${item.engine.toUpperCase()}] ${item.title}\n   ${item.description}\n   ${item.url}`;
      })
      .join("\n\n");

    const summary = [
      `Search Query: "${result.query}"`,
      `Total Results: ${result.number_of_results}`,
      `Engines Used: ${result.enabled_engines.join(", ")}`,
      result.unresponsive_engines.length > 0
        ? `Unresponsive Engines: ${result.unresponsive_engines.join(", ")}`
        : null,
      "",
      "Results:",
      formattedResults,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: summary,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Search failed: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Cloudflare Search MCP Server running on stdio");
  console.error(`Connected to: ${CF_SEARCH_URL}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
