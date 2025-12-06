export const normalizeResults = (results) =>
  results.map((result) => ({
    title: result.title || result.name || "",
    url: result.url || result.link || result.href || "",
    description: result.description || result.content || result.snippet || "",
  }));
