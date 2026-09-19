#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""W38 六刷（v6）：飞雪 9/19 口述补充。

周报增加：
  ① 大数据集团具身智能数据工厂调研（→ 科创）
  ② 保密局实训基地项目尾款追收 30 万（→ 生产经营·收款）
下周工作计划增加：
  ③ AI 公司小辰二期（待客户挂网招标，跟进挂网）
  ④ 搜推工具项目挂网采购（AI 公司推理服务配套工具，推进招采挂网）
另外顺手清掉 v1/v3 并存留下的一处重复条目（客户拜访口径写了两遍）。
"""
import json
import pathlib
from datetime import datetime, timezone

DATA = pathlib.Path("/Users/xuhao/Projects/feixue-workshop") / "public" / "data"
GEN = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

kw = json.loads((DATA / "key-work.json").read_text(encoding="utf-8"))
wr = json.loads((DATA / "weekly-report.json").read_text(encoding="utf-8"))
prod, sci, jj, party, safe = kw["sections"]

# ---- 1) 去重：删掉 v1 那条，保留 v3 更完整的那条
before = len(prod["items"])
prod["items"] = [it for it in prod["items"] if not it["task"].startswith("客户拜访口径核对（⚠️ 数据自相矛盾）")]
assert len(prod["items"]) == before - 1, "去重失败"

# ---- 2) 保密局实训基地尾款追收 30 万
prod["items"].insert(6, {
    "task": "保密局实训基地项目**尾款 30 万元追收**——列入本周重点回款动作，例会确认对接人与到账时间",
    "owner": "例会确认责任人",
    "deadline": "本周推进",
    "source": "收款40分·尾款追收",
})

# ---- 3) AI 公司两单挂网（下周计划）
prod["items"].insert(7, {
    "task": "AI 公司两单挂网（下周关键动作）：**小辰二期**——待客户挂网招标，跟进挂网动态与投标准备；"
            "**搜推工具项目**（推理服务配套工具，约 350 万）——推进招采挂网。两单是 Q4 合同与 AI+ 积分的补充来源",
    "owner": "石宏庆 / 麦著文",
    "deadline": "下周（挂网）",
    "source": "合同60分·Q4补充",
})

# ---- 4) 具身智能数据工厂调研（科创）
sci["items"].append({
    "task": "具身智能数据要素调研：赴**贵州大数据集团·具身智能数据工厂**开展实地调研——"
            "摸清场景合作模式、采集与标注产能、数据存储归属与信创要求等边界，"
            "为我院争取『AI 数据环节』承接位置（数据组织／标注加工／标准评测／合规服务）提供依据",
    "owner": "徐昊 / 杨根琪",
    "deadline": "持续（近期切入点=场景开放）",
    "source": "科创新线·数据要素",
})

kw["generatedAt"] = GEN

# ---- 5) weekly-report：正文两条
wr["workText"] = wr["workText"].replace(
    "5. **资金与合规**：9 月资金预算计划收款",
    "5. **尾款追收**：推进**保密局实训基地项目尾款 30 万元**追收。\n\n"
    "6. **资金与合规**：9 月资金预算计划收款",
)
wr["workText"] = wr["workText"].replace(
    "4. **总部对接与人才指标**：配合总部科创部开展生产作业系统功能测试；",
    "4. **具身智能数据要素调研**：赴贵州大数据集团·具身智能数据工厂开展实地调研，"
    "摸清场景合作模式、采集与标注产能、存储归属与信创要求等边界，"
    "为争取「AI 数据环节」承接位置提供依据。\n\n"
    "5. **总部对接与人才指标**：配合总部科创部开展生产作业系统功能测试；",
)
wr["copyText"] = wr["copyText"].replace(
    "（一）生产经营：",
    "（一）生产经营：",
).replace(
    "贵大74万履约保证金因XC审计、账目冻结暂无法退回。",
    "贵大74万履约保证金因XC审计、账目冻结暂无法退回；推进保密局实训基地项目尾款30万元追收。",
)
wr["copyText"] = wr["copyText"].replace(
    "（二）科创工作：省科技厅市（州）联动项目",
    "（二）科创工作：赴贵州大数据集团·具身智能数据工厂开展实地调研，摸清场景合作模式、采集与标注产能、存储归属与信创要求等边界；"
    "省科技厅市（州）联动项目",
)

# ---- 6) 下周计划两条
wr["nextText"] = wr["nextText"].replace(
    "5. **合规与基础管理**：慧作业纳管后付款流程走通",
    "5. **AI 公司两单挂网**：小辰二期（待客户挂网招标）跟进挂网动态与投标准备；搜推工具项目（推理服务配套工具）推进招采挂网。\n\n"
    "6. **合规与基础管理**：慧作业纳管后付款流程走通",
)
wr["nextCopyText"] = wr["nextCopyText"].replace(
    "五是慧作业付款流程走通",
    "五是推进AI公司两单挂网——小辰二期跟进挂网动态与投标准备、搜推工具项目（推理服务配套工具）推进招采挂网；"
    "六是慧作业付款流程走通",
)
wr["generatedAt"] = GEN
wr["health"] = None

(DATA / "key-work.json").write_text(json.dumps(kw, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
(DATA / "weekly-report.json").write_text(json.dumps(wr, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("key-work:", [(s["name"], len(s["items"])) for s in kw["sections"]],
      "total", sum(len(s["items"]) for s in kw["sections"]))
blob = json.dumps(kw, ensure_ascii=False) + wr["workText"] + wr["copyText"] + wr["nextText"] + wr["nextCopyText"]
bad = [p for p in ["高原", "明文", "ToDesk", "向日葵", "融科", "立行立改", "材料费", "虚假研发"] if p in blob]
print("generatedAt", GEN, "| 降敏:", bad or "clean")
print("周报抽查:", "保密局实训基地" in wr["workText"], "具身智能数据工厂" in wr["workText"])
print("下周抽查:", "小辰二期" in wr["nextText"], "搜推工具" in wr["nextCopyText"])
print("去重后生产经营条数:", len(prod["items"]))
