import { env } from "../envs.js";

// ============================================
// HTML 界面 - HTML UI
// ============================================

export function getSearchHtml() {
  const GOOGLE_ENABLED = env.GOOGLE_API_KEY && env.GOOGLE_CX;
  const DEFAULT_ENGINES = env.DEFAULT_ENGINES || [];
  const handlerEngineDefaultChecked = (engine) =>
    DEFAULT_ENGINES.includes(engine) ? "checked" : "";
  return `<!DOCTYPE html>
<html lang="zh-CN" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>搜索聚合服务 - SearXNG Compatible</title>
  <meta name="description" content="基于 Cloudflare Workers 的多引擎搜索聚合服务,兼容 SearXNG API">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            zinc: {
              50: '#fafafa',
              100: '#f4f4f5',
              200: '#e4e4e7',
              300: '#d4d4d8',
              400: '#a1a1aa',
              500: '#71717a',
              600: '#52525b',
              700: '#3f3f46',
              800: '#27272a',
              900: '#18181b',
            },
            blue: {
              400: '#60a5fa',
              500: '#3b82f6',
              600: '#2563eb',
            }
          }
        }
      }
    }
  </script>

  <style>
    :root {
      --bg-primary: theme('colors.zinc.50');
      --bg-secondary: theme('colors.white');
      --text-primary: theme('colors.zinc.800');
      --text-secondary: theme('colors.zinc.600');
      --border-color: theme('colors.zinc.100');
      --accent-color: theme('colors.blue.500');
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: theme('colors.black');
        --bg-secondary: theme('colors.zinc.900');
        --text-primary: theme('colors.zinc.100');
        --text-secondary: theme('colors.zinc.400');
        --border-color: rgba(63, 63, 70, 0.4);
        --accent-color: theme('colors.blue.400');
      }
    }

    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
    }
  </style>
</head>
<body class="flex h-full flex-col">
  <div class="flex w-full flex-col">
    <!-- 主内容区域 -->
    <div class="relative flex w-full flex-col bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20">
      <main class="flex-auto">
        <div class="sm:px-8 mt-16 sm:mt-32">
          <div class="mx-auto w-full max-w-7xl lg:px-8">
            <div class="relative px-4 sm:px-8 lg:px-12">
              <div class="mx-auto max-w-2xl lg:max-w-5xl">

                <!-- 标题区域 -->
                <div class="max-w-2xl">
                  <div class="text-6xl mb-6">🔍</div>
                  <h1 class="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
                    搜索聚合服务
                  </h1>
                  <p class="mt-6 text-base text-zinc-600 dark:text-zinc-400">
                    基于 Cloudflare Workers 的多引擎搜索聚合服务,支持 Google、DuckDuckGo、Bing、Brave Search,兼容 SearXNG API 规范。
                  </p>
                </div>

                <!-- 搜索表单 -->
                <div class="mt-16 rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
                  <form id="searchForm" class="space-y-4">
                    <div>
                      <label for="searchQuery" class="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                        搜索内容
                      </label>
                      <input
                        type="text"
                        id="searchQuery"
                        placeholder="输入搜索关键词..."
                        required
                        class="w-full rounded-md bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-500"
                      >
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                        选择搜索引擎
                      </label>
                      <div class="grid grid-cols-2 gap-2">
                        <label class="flex items-center space-x-2 ${
                          GOOGLE_ENABLED
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                        }" ${
    !GOOGLE_ENABLED ? 'title="Google 引擎需要配置 API Key"' : ""
  }>
                          <input type="checkbox" name="engine" value="google" ${
                            GOOGLE_ENABLED
                              ? handlerEngineDefaultChecked("google")
                              : "disabled"
                          } class="rounded text-blue-500 focus:ring-blue-500 ${
    !GOOGLE_ENABLED ? "cursor-not-allowed" : ""
  }">
                          <span class="text-sm text-zinc-700 dark:text-zinc-300">
                            Google
                            ${
                              !GOOGLE_ENABLED
                                ? '<span class="text-xs text-zinc-400 dark:text-zinc-500 ml-1">(未配置)</span>'
                                : ""
                            }
                          </span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" name="engine" value="duckduckgo" ${handlerEngineDefaultChecked(
                            "duckduckgo"
                          )} class="rounded text-blue-500 focus:ring-blue-500">
                          <span class="text-sm text-zinc-700 dark:text-zinc-300">DuckDuckGo</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer" title="结果质量不稳定，不建议开启">
                          <input type="checkbox" name="engine" value="bing" ${handlerEngineDefaultChecked(
                            "bing"
                          )} class="rounded text-blue-500 focus:ring-blue-500">
                          <span class="text-sm text-zinc-700 dark:text-zinc-300">
                            Bing
                            <span class="text-xs text-zinc-400 dark:text-zinc-500 ml-1">(不稳定)</span>
                          </span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" name="engine" value="brave" ${handlerEngineDefaultChecked(
                            "brave"
                          )} class="rounded text-blue-500 focus:ring-blue-500">
                          <span class="text-sm text-zinc-700 dark:text-zinc-300">Brave</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="searchBtn"
                      class="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-blue-500 dark:hover:bg-blue-400"
                    >
                      开始搜索
                    </button>
                  </form>
                </div>

                <!-- 搜索结果区域 -->
                <div id="resultsSection" class="mt-8 hidden">
                  <div class="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
                    <div class="flex items-center justify-between mb-4">
                      <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        搜索结果 <span id="resultCount" class="text-sm font-normal text-zinc-500"></span>
                      </h2>
                      <button id="clearBtn" class="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                        清除结果
                      </button>
                    </div>
                    <div id="results" class="space-y-4"></div>
                  </div>
                </div>

                <!-- API 使用方式 -->
                <div class="mt-16 rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
                  <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    API 调用方式
                  </h2>
                  <div class="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <div class="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                      <div class="font-medium text-zinc-900 dark:text-zinc-100 mb-2">GET 请求</div>
                      <code class="text-xs text-blue-600 dark:text-blue-400 break-all" id="apiExample1"></code>
                    </div>
                    <div class="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                      <div class="font-medium text-zinc-900 dark:text-zinc-100 mb-2">POST 请求</div>
                      <code class="text-xs text-blue-600 dark:text-blue-400 break-all" id="apiExample2"></code>
                    </div>
                  </div>
                </div>

                <!-- 支持的搜索引擎 -->
                <div class="mt-16 rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
                  <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    支持的搜索引擎
                  </h2>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50 ${
                      !GOOGLE_ENABLED ? "opacity-50" : ""
                    }">
                      <div class="font-medium text-zinc-900 dark:text-zinc-100">
                        Google
                        ${
                          !GOOGLE_ENABLED
                            ? '<span class="text-xs text-zinc-400 dark:text-zinc-500 ml-1">(未配置)</span>'
                            : ""
                        }
                      </div>
                      <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        全球最大的搜索引擎${
                          !GOOGLE_ENABLED ? ",需配置 API Key" : ""
                        }
                      </p>
                    </div>
                    <div class="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                      <div class="font-medium text-zinc-900 dark:text-zinc-100">DuckDuckGo</div>
                      <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1">注重隐私保护的搜索引擎</p>
                    </div>
                    <div class="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                      <div class="font-medium text-zinc-900 dark:text-zinc-100">
                        Bing
                        <span class="text-xs text-zinc-400 dark:text-zinc-500 ml-1">(不稳定)</span>
                      </div>
                      <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1">微软的搜索引擎，目前结果质量尚不稳定</p>
                    </div>
                    <div class="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                      <div class="font-medium text-zinc-900 dark:text-zinc-100">Brave Search</div>
                      <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1">独立的搜索引擎</p>
                    </div>
                  </div>
                </div>

                <!-- 功能特性 -->
                <div class="mt-16 grid grid-cols-2 gap-4">
                  <div class="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                    <svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    多引擎聚合
                  </div>
                  <div class="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                    <svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    SearXNG 兼容
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 页脚 -->
      <footer class="mt-32">
        <div class="sm:px-8">
          <div class="mx-auto w-full max-w-7xl lg:px-8">
            <div class="border-t border-zinc-100 pt-10 pb-16 dark:border-zinc-700/40">
              <div class="relative px-4 sm:px-8 lg:px-12">
                <div class="mx-auto max-w-2xl lg:max-w-5xl">
                  <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
                    <p class="text-sm text-zinc-400 dark:text-zinc-500">
                      Powered by Cloudflare Workers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>

  <script>
    // 获取当前域名
    const currentOrigin = window.location.origin;

    // 填充 API 示例
    document.getElementById('apiExample1').textContent = currentOrigin + '/search?q=yrobot';
    document.getElementById('apiExample2').textContent = 'curl -X POST "' + currentOrigin + '/search" -d "q=yrobot&engines=duckduckgo,bing"';

    // 搜索表单提交
    document.getElementById('searchForm').addEventListener('submit', async function(event) {
      event.preventDefault();

      const query = document.getElementById('searchQuery').value.trim();
      if (!query) return;

      // 获取选中的搜索引擎 (非必填)
      const engines = Array.from(document.querySelectorAll('input[name="engine"]:checked:not(:disabled)'))
        .map(cb => cb.value)
        .join(',');

      // 显示加载状态
      const searchBtn = document.getElementById('searchBtn');
      const originalText = searchBtn.textContent;
      searchBtn.textContent = '搜索中...';
      searchBtn.disabled = true;

      try {
        // 调用搜索 API
        const url = \`\${currentOrigin}/search?q=\${encodeURIComponent(query)}\`;
        const response = await fetch(engines ? \`\${url}&engines=\${engines}\` : url);
        const data = await response.json();

        // 显示结果
        displayResults(data);
      } catch (error) {
        alert('搜索失败: ' + error.message);
      } finally {
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
      }
    });

    // 显示搜索结果
    function displayResults(data) {
      const resultsSection = document.getElementById('resultsSection');
      const resultsContainer = document.getElementById('results');
      const resultCount = document.getElementById('resultCount');

      resultsSection.classList.remove('hidden');
      resultCount.textContent = \`(共 \${data.number_of_results} 条)\`;

      if (data.results && data.results.length > 0) {
        resultsContainer.innerHTML = data.results.map((result, index) => \`
          <div class="rounded-lg bg-zinc-50 p-4 overflow-scroll dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <div class="flex items-start justify-between">
              <div class="flex-1 overflow-hidden">
                <a href="\${result.url}" target="_blank" class="text-base font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  \${result.title || '无标题'}
                </a>
                <p class="text-xs text-zinc-500 dark:text-zinc-500 mt-1">\${result.url}</p>
                <p class="text-sm text-zinc-700 dark:text-zinc-300 mt-2">\${result.description || '暂无描述'}</p>
              </div>
              <span class="ml-4 text-xs text-zinc-500 dark:text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">\${result.engine}</span>
            </div>
          </div>
        \`).join('');
      } else {
        resultsContainer.innerHTML = '<p class="text-center text-zinc-500 dark:text-zinc-400">没有找到相关结果</p>';
      }

      // 滚动到结果区域
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 清除结果
    document.getElementById('clearBtn').addEventListener('click', function() {
      document.getElementById('resultsSection').classList.add('hidden');
      document.getElementById('results').innerHTML = '';
    });
  </script>
</body>
</html>`;
}
