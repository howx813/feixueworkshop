# 工作周报 · 投放契约（weekly-hub）

/weekly 页面的周报正文来源。每周五 18:00 更新，密码门查看 + 一键复制。

## 流程

1. 飞雪在飞书上让后谷（本机 Hermes）总结本周工作
2. 后谷把正文写入本目录：`<ISO周>.work.md`（如 `2026-W31.work.md`）
3. 后谷在本机终端执行发布链：

```bash
cd /Users/xuhao/Projects/feixue-workshop
npm run tenders:weekly-site \
  && git add public/data/weekly-report.json docs/weekly-hub \
  && git commit -m "chore(weekly): 工作周报 $(date +%G-W%V)" \
  && git pull --rebase -X theirs && git push \
  && npm run deploy
```

## 正文格式（markdown-lite）

- `## 章节名` 分节，`- ` 列表，`> ` 引用，其余普通段落
- 推荐章节：本周重点 / 关键进展·决策 / 数据与交付 / 下周计划（可按飞雪习惯调整）
- 简单明了：每条一行，别写长段落；只写后谷从飞书对话里确知的事，不编造

## 文件名

`date +%G-W%V` 即当前 ISO 周文件名（周五跑就是当周）。
生成器周名不匹配时会提示期望文件名，按提示改名即可。

## 旧目录说明

`docs/weekly-bid-reports/` 是标讯雷达周报（M4 底座），与本工作周报互不相关；
标讯内容按飞雪要求不进 /weekly。
