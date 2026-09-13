#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 W37 工作看板飞书卡片 JSON → /tmp/card-w37.json（v2：补纪检素材+本周会议节点）"""
import json

URL = "https://howx813-d7gx02spb2681185c-1456523152.tcloudbaseapp.com/weekly/?tab="

body = """**周一例会（9/14）对照卡片主持 · 2026-W37**

📅 **本周节点**：9/14（周一）下午 **两委汇报会**——2+1 选人用人专题报告 + 创新研究院专题报告；9/16（周三）**第六轮巡察问题剖析会**——4项问题逐条深入剖析，其中**第4项（科创产品供给能力不足）由本人牵头**，班子/个人剖析材料已拟就待提交
📈 **经营**：全院合同 **1987万**（Q3时序62.10%）、收款 **1086万**（47.01%）。⚠️ 距9/30仅两周——贵大478万 + 省JW 668万 + 先进计算355万 **签订时间点是达标唯一关键**，例会逐单锁定
🔬 **科创**：总部8月调度会 **81分**（全国第6 / 三类省第1）；三上企业研发补助 **29万**获批；重大专项配合资金审计（贵大、瓮福暂无资金支出）
🛡️ **纪检**：廉洁监督员月报已上报（重点报告院重点建设项目物资采购招标问题整改情况）；对相关部门负责人**集体廉洁提醒谈话 + 绩效扣减**；婚丧假报备督促（本周2人外包婚宴报备）
🖥 **网安**：HW现场值守9/8结束转电话值守（本周6人次、处置工单22个、基线合规率100%）；8月态势分析已报总部；下周Q3培训材料 + 漏洞扫描渗透测试
❗ **例会须当面确认**：省JW合同签订状态｜政绩观学习总结会是否已开｜XC安全生产档案补齐｜化公为私材料签字报送（连续两周未反馈）"""

card = {
    "config": {"wide_screen_mode": True},
    "header": {
        "template": "indigo",
        "title": {"tag": "plain_text", "content": "📊 工作看板 · 2026-W37 已更新"},
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

with open("/tmp/card-w37.json", "w", encoding="utf-8") as f:
    json.dump(card, f, ensure_ascii=False)
print("ok", len(json.dumps(card, ensure_ascii=False)))
