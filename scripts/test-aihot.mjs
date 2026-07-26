/**
 * AI HOT 精选接口连通性（部署前）
 */
const url =
  "https://aihot.virxact.com/api/v1/items?mode=selected&window=7d&limit=5&by=timeline";

console.log("\n▸ AI HOT 精选接口");

try {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    console.error(`  ✖ HTTP ${res.status}`);
    process.exit(1);
  }
  const data = await res.json();
  const items = data.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    console.error("  ✖ items 为空或非数组");
    process.exit(1);
  }
  const sample = items[0];
  for (const k of ["id", "title", "summary", "links"]) {
    if (sample[k] == null) {
      console.error(`  ✖ 条目缺少字段: ${k}`);
      process.exit(1);
    }
  }
  if (!sample.links?.aihot) {
    console.error("  ✖ 缺少 links.aihot");
    process.exit(1);
  }
  console.log(`  ✔ mode=selected 返回 ${items.length} 条`);
  console.log(`  ✔ 样例: ${String(sample.title).slice(0, 40)}…`);
} catch (e) {
  console.error("  ✖", e.message || e);
  process.exit(1);
}
