#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""W38 五刷（v5）：飞雪随后补发了同一文件名的**补填版**全院汇总 PPT。

两版差异（逐行 diff 核对，只有两处）：
  1) 落款 2026年9月14日 → **2026年9月20日**
  2) 数转 & 网安 两行由空白 → 补填（A 版是空的，B 版有完整内容）
    · 数转：IT系统维护（因私出国审批流程拓展、车辆及驾驶员信息录入）
            数字化转型自建系统开发（全口径人资/装维系统/新门户改造）
    · 网安：安全运维（工单14个、基线合规率100%、漏洞扫描渗透测试1高危27低危已修复）
            培训与教育（Q3培训材料完成、巡察网信安问题整改：9/15点对点督促会 + 9/18警示教育"十三不准"）
  · 另发现：数转行提到巡察移交问题「共计6项」，与此前移交表「4项」口径不一致 → 需核对

故 v4 里那条「数转&网安三行全空」的结论**作废**，v5 用真实内容替换。
"""
import json
import pathlib
from datetime import datetime, timezone

DATA = pathlib.Path("/Users/xuhao/Projects/feixue-workshop") / "public" / "data"
GEN = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

kw = json.loads((DATA / "key-work.json").read_text(encoding="utf-8"))
wr = json.loads((DATA / "weekly-report.json").read_text(encoding="utf-8"))
prod, sci, jj, party, safe = kw["sections"]

# ---- 1) 作废 v4 的「三行全空」结论，换成真实内容
assert safe["items"][0]["source"] == "全院汇总PPT·板块缺口", safe["items"][0]["source"]
safe["items"][0] = {
    "task": "网信安（归口杜江副院长 / IT网安组）：本周处置安全工单 **14 个**、基线核查合规率 **100%**；"
            "完成一体化支撑系统漏洞扫描与渗透测试，发现 1 个高危、27 个低危**均已修复**；"
            "网信安第三季度培训材料已编制、计划下周组织全省培训；"
            "★**巡察发现的网信安问题整改**——9/15 针对巡察组指出问题组织相关责任人召开点对点整改督促会议推进逐项落实，"
            "9/18 组织全院人员开展网络信息安全典型问题警示教育、集中学习网信安\"十三不准\"条例；"
            "下周：账号稽核、组织全省 Q3 培训、公众号发布《密码法》推文",
    "owner": "IT网安组",
    "deadline": "下周（培训/稽核）",
    "source": "网信安归口（非本人分管）",
}

# ---- 2) 新增数转条（归口，但全院汇总要报省公司，必须过一遍）
safe["items"].insert(1, {
    "task": "数转（归口）：**IT系统维护**——完成因私出国审批流程拓展（按省公司统一安排、基于总部模块拓展贵州本部及分子公司"
            "六岗以上人员审批流程，已启动配置、预计下周完成上线）；完成各分子公司车辆及驾驶员信息 OA 录入，完善车辆基础数据台账。"
            "**数字化转型自建系统开发**——全口径人资（六盘水/创新院/培训/安顺/监理/遵义/学校/铜仁/黔西南等单位本周已发起薪酬流程，"
            "完成各子分公司薪酬模块权限与角色配置，优化调账功能）；装维系统（综维业务改造完成、体验版已发布试用）；"
            "新门户改造（薪酬模块开发完成并迁移、综合行政工作计划管理完成约 60%）。"
            "下周：全省薪酬管理应用支撑、工器具管理开发、薪酬功能测试试用、老门户数据迁移",
    "owner": "IT网安组 / 数转归口",
    "deadline": "下周（因私出国审批上线）",
    "source": "数转归口（非本人分管）",
})

# ---- 3) 巡察问题口径不一致（6项 vs 4项）
party["items"].insert(0, {
    "task": "⚠️ 巡察移交问题数量口径不一致：全院汇总 PPT（数转行）写『根据第六轮党委巡察移交创新院存在问题，"
            "开展问题剖析反思以及问题整改（**共计6项**）』，而 9/10 第一巡察组移交表与本看板此前记录为『**共移交4项**』。"
            "例会前须与巡察办核对——这个数要到省公司口径里用",
    "owner": "徐昊 / 侯雅婧",
    "deadline": "例会前核对",
    "source": "口径待核·巡察",
})

# ---- 4) 巡视（党委第六轮巡视）网信安问题整改 = 纪检督促整改动作
jj["items"].insert(3, {
    "task": "督促巡察网信安问题整改（纪检监督动作）：9/15 组织相关责任人召开点对点整改督促会议，推进问题逐项落实；"
            "9/18 组织全院人员开展网络信息安全典型问题警示教育、集中学习网信安\"十三不准\"条例——"
            "列入监督台账持续跟踪",
    "owner": "侯雅婧",
    "deadline": "持续跟踪",
    "source": "以督促改·巡察整改",
})

kw["generatedAt"] = GEN

# ---- 5) 周报纪检段补一条
wr["workText"] = wr["workText"].replace(
    "5. **日常监督**：督促各部门落实婚假、丧假报备要求；审计整改监督台账持续运行。",
    "5. **督促巡察网信安问题整改**：9 月 15 日组织相关责任人召开点对点整改督促会议推进逐项落实，"
    "9 月 18 日组织全院人员开展网络信息安全典型问题警示教育、集中学习网信安\"十三不准\"条例，列入监督台账持续跟踪。\n\n"
    "6. **日常监督**：督促各部门落实婚假、丧假报备要求；审计整改监督台账持续运行。",
)
wr["copyText"] = wr["copyText"].replace(
    "五是督促各部门落实婚假、丧假报备要求；审计整改监督台账持续运行。",
    "五是督促巡察网信安问题整改，9月15日组织责任人召开点对点整改督促会议、9月18日组织全院开展典型问题警示教育并学习网信安\"十三不准\"。"
    "六是督促各部门落实婚假、丧假报备要求；审计整改监督台账持续运行。",
)
wr["generatedAt"] = GEN
wr["health"] = None

(DATA / "key-work.json").write_text(json.dumps(kw, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
(DATA / "weekly-report.json").write_text(json.dumps(wr, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("key-work:", [(s["name"], len(s["items"])) for s in kw["sections"]],
      "total", sum(len(s["items"]) for s in kw["sections"]))
print("纪检条数:", len(jj["items"]), "| 安全与合规:", len(safe["items"]), "| 党建:", len(party["items"]))
blob = json.dumps(kw, ensure_ascii=False) + wr["workText"] + wr["copyText"]
bad = [p for p in ["高原", "明文", "ToDesk", "向日葵", "融科", "立行立改", "材料费", "虚假研发"] if p in blob]
print("generatedAt", GEN, "| 降敏:", bad or "clean")
print("抽查:", "三行全空" not in json.dumps(kw, ensure_ascii=False), "十三不准" in wr["workText"], "共计6项" in json.dumps(kw, ensure_ascii=False))
