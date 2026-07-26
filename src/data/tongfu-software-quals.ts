/**
 * 贵州通服（含省公司 / 设计院）与「软件 / 信息化 / 系统集成」投标相关的资质摘要。
 * 源表：20240117-贵州通服资质清单（含省公司工程公司、设计院、监理）.xlsx
 * 仅收录与软件类招标常见要求相关的条目，非全量工程资质。
 */

export type TongfuEntity = "省公司" | "设计院" | "工程公司" | "监理";

export type TongfuQual = {
  id: string;
  name: string;
  entity: TongfuEntity;
  /** 用于匹配招标标题/专业/正文的关键词 */
  matchKeys: string[];
  /** 软件类标讯中的典型用途 */
  useCase: string;
};

export const tongfuSoftwareQuals: TongfuQual[] = [
  {
    id: "cmmi3",
    name: "CMMI 软件能力成熟度模型评估（3级）",
    entity: "省公司",
    matchKeys: ["CMMI", "软件能力成熟度", "软件开发", "应用软件"],
    useCase: "软件开发 / 定制开发常见门槛",
  },
  {
    id: "cmmi5",
    name: "CMMI5",
    entity: "设计院",
    matchKeys: ["CMMI", "CMMI5", "软件能力成熟度", "软件开发"],
    useCase: "高等级软件研发项目",
  },
  {
    id: "cs2-tf",
    name: "信息系统建设和服务能力（CS贰级）",
    entity: "省公司",
    matchKeys: ["CS", "信息系统建设和服务", "系统集成", "信息化"],
    useCase: "信息系统建设 / 集成交付",
  },
  {
    id: "cs2-sj",
    name: "信息系统建设和服务能力等级证书 CS2",
    entity: "设计院",
    matchKeys: ["CS", "信息系统建设和服务", "系统集成"],
    useCase: "系统集成 / 信息化建设",
  },
  {
    id: "iso20000-tf",
    name: "信息技术服务管理体系认证证书（ISO20000）",
    entity: "省公司",
    matchKeys: ["ISO20000", "ISO 20000", "信息技术服务管理", "IT服务", "运维"],
    useCase: "运维 / IT 服务管理",
  },
  {
    id: "iso27001-tf",
    name: "信息安全管理体系认证证书（ISO27001）",
    entity: "省公司",
    matchKeys: ["ISO27001", "ISO 27001", "信息安全", "等保", "网络安全"],
    useCase: "安全类 / 涉数据项目",
  },
  {
    id: "itss3",
    name: "信息技术服务标准（ITSS）三级",
    entity: "省公司",
    matchKeys: ["ITSS", "运行维护", "运维服务", "ITO"],
    useCase: "运维服务能力证明",
  },
  {
    id: "itss-sj",
    name: "ITSS（运行维护服务能力成熟度模型）三级",
    entity: "设计院",
    matchKeys: ["ITSS", "运行维护", "运维"],
    useCase: "运维服务类招标",
  },
  {
    id: "sysint-aaa",
    name: "信息通信行业企业信用等级评价（系统集成领域 AAA）",
    entity: "省公司",
    matchKeys: ["系统集成", "集成领域", "AAA"],
    useCase: "系统集成投标信用条件",
  },
  {
    id: "ops-aaa",
    name: "信息通信行业企业信用等级评价（运维服务领域 AAA）",
    entity: "省公司",
    matchKeys: ["运维服务", "运维", "AAA"],
    useCase: "运维服务信用条件",
  },
  {
    id: "dcmm2",
    name: "DCMM 数据管理能力成熟度（2级）",
    entity: "省公司",
    matchKeys: ["DCMM", "数据管理", "大数据", "数据治理"],
    useCase: "数据平台 / 数据治理",
  },
  {
    id: "dsmm2",
    name: "数据安全能力成熟度模型等级二级（DSMM）",
    entity: "省公司",
    matchKeys: ["DSMM", "数据安全", "数据安全能力"],
    useCase: "数据安全类项目",
  },
  {
    id: "ccrc",
    name: "CCRC 信息安全服务资质认证证书",
    entity: "省公司",
    matchKeys: ["CCRC", "信息安全服务", "安全服务", "安全集成", "风险评估"],
    useCase: "信息安全服务",
  },
  {
    id: "secret-tf",
    name: "涉密（总体集成，安防监控，运行维护）乙级",
    entity: "省公司",
    matchKeys: ["涉密", "保密", "总体集成"],
    useCase: "涉密信息化项目",
  },
  {
    id: "secret-sj",
    name: "涉密信息系统集成资质证书乙级——系统集成、软件开发",
    entity: "设计院",
    matchKeys: ["涉密", "保密", "软件开发", "系统集成"],
    useCase: "涉密软件 / 集成",
  },
  {
    id: "software-ent",
    name: "软件企业",
    entity: "设计院",
    matchKeys: ["软件企业", "软件开发", "双软"],
    useCase: "软件企业资质门槛",
  },
  {
    id: "software-product",
    name: "软件产品证书",
    entity: "设计院",
    matchKeys: ["软件产品", "软著", "软件著作权"],
    useCase: "软件产品 / 著作权类要求",
  },
  {
    id: "vas-license",
    name: "增值电信业务经营许可证",
    entity: "省公司",
    matchKeys: ["增值电信", "IDC", "ISP", "云服务", "云计算"],
    useCase: "云 / 通信增值业务",
  },
  {
    id: "ei-1",
    name: "建筑业企业资质证书（电子与智能化工程专业承包壹级）",
    entity: "省公司",
    matchKeys: ["电子与智能化", "智能化", "弱电", "安防监控", "智慧"],
    useCase: "智能化 / 弱电集成",
  },
  {
    id: "iso9001",
    name: "质量管理体系认证书",
    entity: "省公司",
    matchKeys: ["ISO9001", "质量管理体系", "质量体系"],
    useCase: "通用体系门槛",
  },
];

/** 判定「软件类」标讯的标题/专业关键词 */
export const softwareProjectKeys = [
  "软件开发",
  "软件系统",
  "应用软件",
  "信息系统",
  "系统集成",
  "信息化",
  "数字化",
  "智慧",
  "大数据",
  "人工智能",
  "AI",
  "数据平台",
  "业务系统",
  "管理平台",
  "运维服务",
  "信息运维",
  "ITO",
  "云服务",
  "云计算",
  "等保",
  "网络安全",
  "信息安全",
  "数据治理",
  "软件",
  "平台建设",
  "平台开发",
];

export const softwareExcludeKeys = [
  "绿植",
  "绿化",
  "吊顶",
  "课桌",
  "校服",
  "教材",
  "图书采购",
  "药品",
  "疫苗",
  "化肥",
  "农药",
  "单体液压支柱",
  "焦化",
  "煤炭洗选",
];
