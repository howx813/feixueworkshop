#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 W38 工作看板飞书卡片 JSON → /tmp/card-w38.json"""
import json

URL = "https://howx813-d7gx02spb2681185c-1456523152.tcloudbaseapp.com/weekly/?tab="

body = """**周一例会（9/21）对照卡片主持 · 2026-W38**

📈 **经营**：全院合同 **2655.87万**（Q3时序 **83.00%**）、非关联 **2196.35万**（78.44%）。9月最大单笔 **省JW国产化 668.67万已签订**。⚠️ 距9/30仅两周——**流程中9单1099.67万办结是达标唯一关键**（贵大478.19/智能体297/隧道群276.23），分管口径距Q3节点2133万缺约354万
💧 **回款（最大短板）**：收款 **1086万 / 47.01%**，连续三周零增长。9月预算收款514.07万 vs 付款598.03万，**收小于付**；省公司匹配资金100万仅够工资社保+48万保证金，8月绩效与9月外包工资**待回款到位**
🛡️ **纪检**：完成9月集中学习（招标投标及违规转分包整治监督方案 + 招标采购违规集体谈话警示教育）；**智慧监督系统发布监督任务 + 云巡查**；**制发监督函单1份**督促津补贴清退整改
📁 **巡察关注**：项目档案（纸质/电子）归集滞后 + 项目安全生产档案归集滞后——所有中心尽快完成；9/16剖析会已开，本人牵头第4项（科创产品）转整改台账
🔬 **科创**：**省科技厅市（州）联动项目『人体行为和生命体征预警与防控服务平台研发』拟立项通过**（通服承担、石宏庆负责，科技成果一般项目，执行期2026.9.1—2028.8.31，经费300/200/100万）——区科技局**催填合同模板、本周拨100万**；三上研发补助**29万**预计9—10月到款
❗ **例会须当面确认**：流程中9单办结时间点｜先进计算355万中标结果是否已录入｜慧作业付款流程能否走通｜化公为私材料签字（W37起未反馈）｜科技厅联动项目合同模板报送责任人"""

card = {
    "config": {"wide_screen_mode": True},
    "header": {
        "template": "indigo",
        "title": {"tag": "plain_text", "content": "📊 工作看板 · 2026-W38 已更新（v2 科创补报）"},
    },
    "elements": [
        {"tag": "div", "text": {"tag": "lark_md", "content": body}},
        {
            "tag": "action",
            "actions": [
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "📄 工作周报"},
                    "type": "default",
                    "url": URL + "weekly",
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "🎯 重点工作安排"},
                    "type": "primary",
                    "url": URL + "keywork",
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "📊 指标看板"},
                    "type": "default",
                    "url": URL + "kpi",
                },
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "🏷️ 数据标注"},
                    "type": "default",
                    "url": URL + "labeling",
                },
            ],
        },
    ],
}

with open("/tmp/card-w38-v2.json", "w", encoding="utf-8") as f:
    json.dump(card, f, ensure_ascii=False)
print("ok card-w38-v2", len(json.dumps(card, ensure_ascii=False)))
