#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 W38 工作看板飞书卡片 v3（部门周例会包已找回、科创板块已补全）"""
import json

URL = "https://howx813-d7gx02spb2681185c-1456523152.tcloudbaseapp.com/weekly/?tab="

body = """**周一例会（9/21）对照卡片主持 · 2026-W38 · 部门材料已齐**

📈 **经营**：全院合同 **2655.87万**（Q3时序 **83.00%**）、非关联 **2196.35万**、收款 **1086万（47.01%，连续三周持平）**。9月已确认中标3项：**贵大能力提升478.18万 + 省JW 668.67万 + 先进计算351.8万**；创新业务部三季度合同目标 **2180万**——**流程中9单1099.67万办结是达标唯一关键**
⚠️ **口径冲突（须统一）**：省JW 668.67万——市场集客/创新业务部报「已签订」，政法中心报「签订当中」；实施侧已启动：2个机房查勘、机柜/端口盘点、与大华厂家对接软硬件统一出口，计划采购 **600万**
💧 **回款**：Q3仅47.01%三周未动；AI中心4个项目剩余应收 **237.91万**（9月内26.29万），**AI能力优化11月终验触发回款183.44万**；贵大74万履约保证金因该校XC审计、账目冻结暂无法退
🔬 **科创**：厅市联动项目《人体行为和生命体征预警与防控服务平台研发》**基本通过省厅审核、正填合同书报区科技局**（专项 **100万** + 自筹200万），本周拨100万；三上补助 **29万**已提交拨款材料；重大专项4项（296/297/283/46万）已批、具身智能过技术评审。⚠️ **XC培训15人指标仅过8人**（10/11月两轮补考）；**贵大课题自筹因负责人变更或拖累中期验收**
📁 **巡察/党建**：项目档案＋安全生产档案归集仍滞后（所有中心尽快完成）；已拟定巡中问题整改台账，9月底交回复材料；保密自查检查表本周报送
❗ **例会须当面确认**：省JW签订口径与状态｜流程中9单办结时间点｜XC培训7人补考责任人｜贵大课题自筹｜**拜访数据三个口径对不上（20/18/40条）**｜化公为私材料签字（W37起未反馈）"""

card = {
    "config": {"wide_screen_mode": True},
    "header": {
        "template": "indigo",
        "title": {"tag": "plain_text", "content": "📊 工作看板 · 2026-W38 已更新（v3 部门材料已并入）"},
    },
    "elements": [
        {"tag": "div", "text": {"tag": "lark_md", "content": body}},
        {
            "tag": "action",
            "actions": [
                {"tag": "button", "text": {"tag": "plain_text", "content": "📄 工作周报"},
                 "type": "default", "url": URL + "weekly"},
                {"tag": "button", "text": {"tag": "plain_text", "content": "🎯 重点工作安排"},
                 "type": "primary", "url": URL + "keywork"},
                {"tag": "button", "text": {"tag": "plain_text", "content": "📊 指标看板"},
                 "type": "default", "url": URL + "kpi"},
                {"tag": "button", "text": {"tag": "plain_text", "content": "🏷️ 数据标注"},
                 "type": "default", "url": URL + "labeling"},
            ],
        },
    ],
}

with open("/tmp/card-w38-v3.json", "w", encoding="utf-8") as f:
    json.dump(card, f, ensure_ascii=False)
print("ok card-w38-v3", len(json.dumps(card, ensure_ascii=False)))
