# Cloudflare Search

> 基于 Cloudflare Workers 的聚合搜索 API 服务

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Yrobot/cloudflare-search)

## 特性

- 🔍 **多引擎聚合** - 同时使用多个搜索引擎（Google、Brave、DuckDuckGo、Bing）
- ⚡ **并行搜索** - 所有搜索引擎同时请求，快速返回结果
- 🛡️ **容错机制** - 单个引擎失败不影响其他引擎，自动标记无响应引擎
- ⏱️ **超时控制** - 可配置请求超时时间，避免长时间等待
- 🔒 **Token 鉴权** - 支持 Token 认证，保护服务不被滥用
- 🌍 **CORS 支持** - 完整的跨域资源共享支持
- 🎨 **Web 界面** - 提供简洁的搜索界面，方便测试
- ⚡ **零成本运行** - Cloudflare Workers 免费版每天 10 万次请求

## 页面展示

![screenshot](./screenshot.png)

## 安装方式

### 方式一：一键部署（推荐）

点击上方 "Deploy to Cloudflare Workers" 按钮，按照提示完成部署。

### 方式二：使用 Wrangler CLI

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 克隆仓库
git clone https://github.com/Yrobot/cloudflare-search.git
cd cloudflare-search

# 4. 部署
wrangler deploy
```

### 方式三：使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击 **Create Application** > **Create Worker**
4. 点击 **Upload** 上传本地代码文件夹
   - 选择克隆的 `cloudflare-search` 文件夹
   - 或者手动复制 `worker.js`、`envs.js`、`utils/` 等文件
5. 点击 **Save and Deploy**

### 获取访问地址

部署成功后，你会获得一个 Worker URL：

```
https://your-worker-name.your-subdomain.workers.dev
```

**注意**：这个自带的域名在某些区域可能无法直接访问，建议绑定自己的域名使用。

## 使用方式

### 方式 1: Web 界面

直接访问你的 Worker URL，在网页界面输入搜索关键词：

```
https://$YOUR-DOMAIN/
```

### 方式 2: API 请求（GET）

使用查询参数进行搜索：

```bash
# 基本搜索
curl "https://$YOUR-DOMAIN/search?q=cloudflare"

# 指定搜索引擎
curl "https://$YOUR-DOMAIN/search?q=cloudflare&engines=google,brave"

# 使用 token 鉴权（如果配置了 TOKEN 环境变量）
curl "https://$YOUR-DOMAIN/search?q=cloudflare&token=$YOUR-TOKEN"
```

### 方式 3: API 请求（POST）

通过 POST 表单提交搜索：

```bash
curl -X POST "https://$YOUR-DOMAIN/search" \
  -d "q=cloudflare" \
  -d "engines=google,brave"
  -d "token=$YOUR-TOKEN" # 如果配置了 TOKEN 环境变量
```

## API 接口说明

### `/search` 接口

用于执行搜索查询并返回聚合结果。

#### 请求参数

| 参数          | 类型     | 必填   | 说明                                      | 示例           |
| ------------- | -------- | ------ | ----------------------------------------- | -------------- |
| `q` / `query` | `string` | yes    | 搜索关键词                                | `cloudflare`   |
| `engines`     | `string` | no     | 指定搜索引擎，多个用逗号分隔              | `google,brave` |
| `token`       | `string` | no/yse | 访问令牌（当配置了 TOKEN 环境变量时必填） | `$YOUR-TOKEN`  |

**支持的搜索引擎**：

- `google` - Google 搜索（需要配置 API Key）
- `brave` - Brave 搜索
- `duckduckgo` - DuckDuckGo 搜索
- `bing` - Bing 搜索

#### 返回值

```typescript
{
  query: string;                    // 搜索关键词
  number_of_results: number;        // 结果总数
  enabled_engines: string[];        // 启用的搜索引擎列表
  unresponsive_engines: string[];   // 无响应的搜索引擎列表
  results: Array<{
    title: string;                  // 结果标题
    description: string;            // 结果描述
    url: string;                    // 结果链接
    engine: string;                 // 来源引擎
  }>;
}
```

#### 请求示例

```bash
# GET 请求
curl "https://$YOUR-DOMAIN/search?q=cloudflare&engines=google,brave"

# POST 请求
curl -X POST "https://$YOUR-DOMAIN/search" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "q=cloudflare&engines=google,brave"
```

#### 响应示例

```json
{
  "query": "cloudflare",
  "number_of_results": 15,
  "enabled_engines": ["google", "brave", "duckduckgo"],
  "unresponsive_engines": [],
  "results": [
    {
      "title": "Cloudflare - The Web Performance & Security Company",
      "description": "Cloudflare is on a mission to help build a better Internet...",
      "url": "https://www.cloudflare.com/",
      "engine": "google"
    },
    {
      "title": "Cloudflare Workers",
      "description": "Deploy serverless code instantly across the globe...",
      "url": "https://workers.cloudflare.com/",
      "engine": "brave"
    }
  ]
}
```

## 搜索引擎说明

### 支持的搜索引擎

| 引擎           | 说明                     | 是否需要配置                  | 默认启用        |
| -------------- | ------------------------ | ----------------------------- | --------------- |
| **Google**     | Google Custom Search API | 需要 GOOGLE_API_KEY GOOGLE_CX | yes             |
| **Brave**      | Brave Search API         | -                             | yes             |
| **DuckDuckGo** | DuckDuckGo 即时答案 API  | -                             | yes             |
| **Bing**       | Bing 搜索                | -                             | no (结果不稳定) |

### 基本工作方案

1. **并行请求**：所有启用的搜索引擎同时发起请求，提高响应速度
2. **超时控制**：单个引擎超时不影响其他引擎，默认 3 秒超时
3. **结果聚合**：将所有成功返回的结果合并，标记来源引擎
4. **容错处理**：记录无响应的引擎，返回部分结果而不是完全失败

## 环境变量配置

### 环境变量说明

| 变量名            | 类型     | 默认值   | 说明                                              |
| ----------------- | -------- | -------- | ------------------------------------------------- |
| `DEFAULT_TIMEOUT` | `string` | `"3000"` | 单个搜索引擎的超时时间（毫秒）                    |
| `GOOGLE_API_KEY`  | `string` | `null`   | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CX`       | `string` | `null`   | https://programmablesearchengine.google.com/      |
| `TOKEN`           | `string` | `null`   | 访问令牌，配置后启用鉴权，保护服务不被滥用        |

**注意**：

- Google Custom Search API 免费版每天限制 100 次请求
- `TOKEN` 配置后，所有请求都需要提供有效的 token

### 配置方式

#### 方式 1: wrangler.toml 文件

编辑 `wrangler.toml` 文件中的 `[vars]` 部分：

```toml
[vars]
GOOGLE_API_KEY = "your-google-api-key"
GOOGLE_CX = "your-google-custom-search-cx"
DEFAULT_TIMEOUT = "3000"
TOKEN = "your-secret-token-here"
```

#### 方式 2: Cloudflare Dashboard

1. 进入 Worker 设置页面
2. 找到 **Environment Variables** 部分
3. 添加变量并保存

## 使用场景

### 1. 聚合搜索服务

构建自己的搜索聚合 API，整合多个搜索引擎结果：

```javascript
const response = await fetch(
  "https://$YOUR-DOMAIN/search?q=javascript&engines=google,brave"
);
const data = await response.json();
console.log(`找到 ${data.number_of_results} 个结果`);
```

### 2. 前端搜索功能

为网站或应用添加搜索功能：

```javascript
async function search(query) {
  const response = await fetch(
    `https://$YOUR-DOMAIN/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data.results;
}
```

### 3. 数据采集与分析

收集多个搜索引擎的结果进行对比分析：

```javascript
const engines = ["google", "brave", "duckduckgo"];
const results = await fetch(
  `https://$YOUR-DOMAIN/search?q=AI&engines=${engines.join(",")}`
);
const data = await results.json();

// 按引擎分组
const byEngine = data.results.reduce((acc, result) => {
  acc[result.engine] = acc[result.engine] || [];
  acc[result.engine].push(result);
  return acc;
}, {});
```

## MCP 集成

通过 MCP (Model Context Protocol) 让 AI 助手直接调用你的搜索服务，获取实时搜索结果。

### 安装配置

#### 1. 添加 MCP 服务器配置

编辑配置文件（[配置指南](https://modelcontextprotocol.io/quickstart/user)）：

- **Claude Code**: `~/.claude/config.json` / `~/.claude.json`
- **Claude Desktop macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "cloudflare-search": {
      "command": "npx",
      "args": ["-y", "@yrobot/cf-search-mcp"],
      "env": {
        "CF_SEARCH_URL": "https://your-worker.workers.dev",
        "CF_SEARCH_TOKEN": "your-token-here"
      }
    }
  }
}
```

**环境变量说明**：

- `CF_SEARCH_URL`: Worker 部署地址（必填）
- `CF_SEARCH_TOKEN`: 鉴权 Token（如果 Worker 配置了 TOKEN 则必填）

#### 2. 重启应用

保存配置后重启 Claude Code 或 Claude Desktop。

#### 3. 验证安装

- 在 Claude Code 中运行 `/mcp` 命令，应该能看到 `cloudflare-search` 工具。
- 或 使用 `claude mcp list`, 看到 `cloudflare-search: npx -y @yrobot/cf-search-mcp@latest - ✓ Connected` 说明配置成功

### 使用示例

```
用 cloudflare-search 搜索 "Cloudflare Workers 最佳实践"
```

```
用 cloudflare-search 搜索 "Next.js 14 新特性"
```

AI 会返回来自多个搜索引擎的聚合结果，包括标题、描述和链接。

## 注意与提醒

### 🚨 重要提示

1. **使用自定义域名**

   - Cloudflare 默认的 `*.workers.dev` 域名在某些地区可能无法访问
   - **强烈建议**绑定自己的域名以获得更好的访问体验
   - 在 Worker 设置中点击 **Triggers** > **Add Custom Domain** 添加自定义域名

2. **搜索引擎限制**

   - Google API 免费版每天限制 100 次请求
   - 其他搜索引擎一般没有严格限制，但请合理使用
   - 频繁请求可能导致被临时限制访问

3. **超时设置**
   - 默认单个引擎超时 3 秒
   - 可通过环境变量 `DEFAULT_TIMEOUT` 调整
   - 建议不要设置过长，避免整体响应时间过长

### 🔒 安全配置

#### 启用鉴权

1. 配置 `TOKEN` 环境变量 来保护你的服务不被滥用：

- 利用 wrangler.toml 配置 TOKEN 环境变量
- 通过 Cloudflare Worker Dashboard 配置 TOKEN 环境变量

2. 在请求时传入 token：

```bash
# 访问首页
https://$YOUR-DOMAIN?token=$YOUR-TOKEN

# 使用 query/body 的 token 参数 请求 API
curl "https://$YOUR-DOMAIN/search?q=cloudflare&token=$YOUR-TOKEN"

curl -X POST "https://$YOUR-DOMAIN/search" \
  -d "q=cloudflare" \
  -d "token=$YOUR-TOKEN"
```

## 常见问题

### Q: 为什么有些搜索引擎返回结果为空？

A: 可能原因：

- 搜索引擎 API 临时不可用或响应超时
- 搜索关键词没有相关结果
- 搜索引擎限制了访问频率
- Google 需要配置 API Key 才能使用

可以查看返回的 `unresponsive_engines` 字段了解哪些引擎没有响应。

### Q: 如何提高搜索速度？

A: 建议：

- 减少启用的搜索引擎数量，只使用需要的引擎
- 适当调整超时时间（`DEFAULT_TIMEOUT`）

### Q: Bing 搜索为什么默认禁用？

A: Bing 搜索结果目前不够稳定，出现内容与搜索关联度低的情况。如需使用，可以在请求时手动指定：`engines=bing` 或修改 `envs.js` 中的 `DEFAULT_ENGINES`。

### Q: 如何保护服务不被滥用？

A: 建议配置 `TOKEN` 环境变量启用鉴权：

1. 在 `wrangler.toml` 中设置 `TOKEN = "your-random-token"`
2. 或在 Cloudflare Dashboard 的 Environment Variables 中添加
3. 配置后所有请求都需要提供有效的 token

鉴权失败会返回 401 错误

## 免责声明

本项目仅供学习和研究使用，使用者需遵守以下规定：

1. **合法使用** - 仅用于合法搜索需求，不得用于违法或侵权用途
2. **服务条款** - 使用时需遵守 Cloudflare Workers 和各搜索引擎的服务条款
3. **API 限制** - 遵守各搜索引擎 API 的使用限制和配额
4. **责任自负** - 使用本服务产生的任何后果由使用者自行承担
5. **商业用途** - 如需商业使用，请确保符合相关法律法规和服务条款

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[GPL-3 License](LICENSE)

## 相关链接

- [项目 GitHub](https://github.com/Yrobot/cloudflare-search)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Google Custom Search API](https://developers.google.com/custom-search/v1/overview)

## 支持一下

如果这个项目对你有帮助，可以请作者喝杯咖啡 ☕

<image src="https://yrobot.top/donate_wx.jpeg" width="300"/>
