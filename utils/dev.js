// HTTPS_PROXY=http://localhost:7777 bun ./output/cloudflare-search/utils/dev.js

import searchBrave from "./searchBrave.js";
import searchGoogle from "./searchGoogle.js";
import searchDuckDuckGo from "./searchDuckDuckGo.js";
import searchBing from "./searchBing.js";

const query = "yrobot 博客";

(async () => {
  const results = await searchBing({
    query,
  });
  console.log({ results });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
