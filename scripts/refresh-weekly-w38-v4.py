#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""W38 四刷（v4）：并入《创新研究院（周例会PPT）2026年38周》全院汇总 PPT 的增量。

该 PPT 只有 5 页，绝大部分内容与 v3 已并入的部门材料重合。实质增量三处：
  1) 经营情况头条：全院累计**中标 4159 万**（= 一季度 976 万 + 三季度 3182.69 万，两数均取自同表）
  2) 厅市联动项目下周动作：**系统填报合同书**
  3) 数转 & 网安 板块**三行全空**（IT系统维护 / 数字化转型自建系统开发 / 网络与信息安全工作
     的"上周完成情况""下周计划"均空白）—— 全院汇总里的硬缺口
"""
import json
import pathlib
from datetime import datetime, timezone

DATA = pathlib.Path("/Users/xuhao/Projects/feixue-workshop") / "public" / "data"
GEN = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

kw = json.loads((DATA / "key-work.json").read_text(encoding="utf-8"))
wr = json.loads((DATA / "weekly-report.json").read_text(encoding="utf-8"))
prod, sci, jj, party, safe = kw["sections"]

# 1) 经营锚点补中标口径
prod["anchor"] = prod["anchor"].replace(
    "收款1086万/47.01%",
    "收款1086万/47.01% · 全院累计中标4159万（＝一季度976万＋三季度3182.69万）",
)

# 2) 生产经营首条补"中标/合同/收款"三段口径
prod["items"].insert(0, {
    "task": "全院经营情况四数（全院汇总PPT头条）：**新签合同额 2656 万 · 收款 1086 万 · 中标 4159 万 · 收入 2207 万**。"
            "其中中标口径＝一季度 976 万＋三季度 3182.69 万（均取自同表，Q2 未披露）；"
            "⚠️ 中标 4159 万 与 指标体系『新中标金额（不含框架）3182.69 万』不同口径，对外引用时须说明含不含框架",
    "owner": "徐昊（例会口径统一）",
    "deadline": "例会明确",
    "source": "全院汇总PPT·口径提示",
})

# 3) 厅市联动：补下周动作（系统填报合同书）
for it in sci["items"]:
    if it["task"].startswith("★厅市联动项目"):
        it["task"] = it["task"].replace(
            "区科技局本周拨付100万。",
            "**下周动作：系统填报合同书**；区科技局本周拨付100万。",
        )
        break

# 4) 科创：重大专项补下周动作
for it in sci["items"]:
    if it["task"].startswith("省科技重大专项4项"):
        it["task"] = it["task"].replace(
            "例会须指定对接人跟进",
            "例会须指定对接人跟进；下周动作＝做好重大专项建设与资金管理",
        )
        break

# 5) 安全与合规：数转/网安板块空白（全院汇总硬缺口）
safe["items"].insert(0, {
    "task": "⚠️ 数转 & 网安板块本周**全院汇总 PPT 三行全空**：『IT系统维护』『数字化转型自建系统开发』"
            "『网络与信息安全工作』的『上周完成情况』与『下周计划』均为空白——"
            "全院汇总是要报省公司领导的材料，这两块缺内容会被直接看出来。例会须定填报责任人并补齐",
    "owner": "IT网安组 / 数转归口（例会定）",
    "deadline": "例会明确·下次填报前补齐",
    "source": "全院汇总PPT·板块缺口",
})

kw["generatedAt"] = GEN

# weekly-report：生产经营段补中标口径
wr["workText"] = wr["workText"].replace(
    "累计收款 **1086 万元**、时序进度 **47.01%**（连续三周持平），收款仍是最大短板。",
    "累计收款 **1086 万元**、时序进度 **47.01%**（连续三周持平），收款仍是最大短板；"
    "全院累计中标 **4159 万元**（＝一季度 976 万元＋三季度 3182.69 万元，为全院汇总 PPT 口径，"
    "与指标体系『不含框架 3182.69 万元』口径不同）。",
)
wr["copyText"] = wr["copyText"].replace(
    "累计收款1086万元、时序47.01%，连续三周持平，收款仍是最大短板。",
    "累计收款1086万元、时序47.01%，连续三周持平，收款仍是最大短板；全院累计中标4159万元（＝一季度976万＋三季度3182.69万，全院汇总PPT口径，与「不含框架3182.69万」口径不同）。",
)
wr["workText"] = wr["workText"].replace(
    "区科技局本周拨付首笔 100 万元。",
    "下周动作：系统填报合同书；区科技局本周拨付首笔 100 万元。",
)
wr["copyText"] = wr["copyText"].replace(
    "区科技局本周拨付首笔100万元；",
    "区科技局本周拨付首笔100万元、下周系统填报合同书；",
)
wr["generatedAt"] = GEN
wr["health"] = None

(DATA / "key-work.json").write_text(json.dumps(kw, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
(DATA / "weekly-report.json").write_text(json.dumps(wr, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("key-work:", [(s["name"], len(s["items"])) for s in kw["sections"]],
      "total", sum(len(s["items"]) for s in kw["sections"]))
blob = json.dumps(kw, ensure_ascii=False) + wr["workText"] + wr["copyText"]
bad = [p for p in ["高原", "明文", "ToDesk", "向日葵", "融科", "立行立改", "材料费", "虚假研发"] if p in blob]
print("generatedAt", GEN, "| 降敏:", bad or "clean")
print("抽查:", "4159" in wr["workText"], "系统填报合同书" in wr["workText"],
      "三行全空" in json.dumps(kw, ensure_ascii=False))
