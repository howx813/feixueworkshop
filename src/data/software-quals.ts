/**
 * 软件 / 信息化 / 系统集成类招标常见资质关键词（公开行业标准名称）。
 * 仅用于标讯匹配提示，不代表任何单位持证情况。
 */

export type QualDomain = "研发" | "集成" | "安全" | "运维" | "数据" | "通用";

export type SoftwareQual = {
  id: string;
  name: string;
  domain: QualDomain;
  matchKeys: string[];
  useCase: string;
};

export const softwareQuals: SoftwareQual[] = [
  {
    id: "cmmi3",
    name: "CMMI 软件能力成熟度（3级）",
    domain: "研发",
    matchKeys: ["CMMI", "软件能力成熟度", "软件开发", "应用软件"],
    useCase: "软件开发 / 定制开发",
  },
  {
    id: "cmmi5",
    name: "CMMI5",
    domain: "研发",
    matchKeys: ["CMMI", "CMMI5", "软件能力成熟度", "软件开发"],
    useCase: "高等级软件研发",
  },
  {
    id: "cs2",
    name: "信息系统建设和服务能力（CS）",
    domain: "集成",
    matchKeys: ["CS", "信息系统建设和服务", "系统集成", "信息化"],
    useCase: "信息系统建设 / 集成",
  },
  {
    id: "iso20000",
    name: "ISO20000 信息技术服务管理",
    domain: "运维",
    matchKeys: ["ISO20000", "ISO 20000", "信息技术服务管理", "IT服务", "运维"],
    useCase: "IT 服务 / 运维",
  },
  {
    id: "iso27001",
    name: "ISO27001 信息安全管理",
    domain: "安全",
    matchKeys: ["ISO27001", "ISO 27001", "信息安全", "等保", "网络安全"],
    useCase: "信息安全类项目",
  },
  {
    id: "itss3",
    name: "ITSS 信息技术服务标准",
    domain: "运维",
    matchKeys: ["ITSS", "运行维护", "运维服务", "ITO"],
    useCase: "运维服务",
  },
  {
    id: "sysint",
    name: "系统集成相关",
    domain: "集成",
    matchKeys: ["系统集成", "运营商系统集成"],
    useCase: "系统集成投标",
  },
  {
    id: "dcmm2",
    name: "DCMM 数据管理能力",
    domain: "数据",
    matchKeys: ["DCMM", "数据管理", "大数据", "数据治理"],
    useCase: "数据平台 / 治理",
  },
  {
    id: "dsmm2",
    name: "DSMM 数据安全能力",
    domain: "数据",
    matchKeys: ["DSMM", "数据安全"],
    useCase: "数据安全",
  },
  {
    id: "ccrc",
    name: "CCRC 信息安全服务",
    domain: "安全",
    matchKeys: ["CCRC", "信息安全服务", "安全集成", "风险评估"],
    useCase: "安全服务",
  },
  {
    id: "secret",
    name: "涉密相关集成/开发",
    domain: "安全",
    matchKeys: ["涉密", "保密"],
    useCase: "涉密信息化（以文件为准）",
  },
  {
    id: "software-ent",
    name: "软件企业 / 软件产品",
    domain: "研发",
    matchKeys: ["软件企业", "软件产品", "软著"],
    useCase: "软件企业门槛",
  },
  {
    id: "vas",
    name: "增值电信业务经营许可",
    domain: "通用",
    matchKeys: ["增值电信", "云服务", "云计算"],
    useCase: "云 / 通信增值",
  },
  {
    id: "ei-1",
    name: "电子与智能化工程",
    domain: "集成",
    matchKeys: ["电子与智能化", "智能化", "弱电", "安防监控", "智慧安防"],
    useCase: "智能化 / 弱电",
  },
  {
    id: "iso9001",
    name: "质量管理体系",
    domain: "通用",
    matchKeys: ["ISO9001", "质量管理体系", "质量体系"],
    useCase: "通用体系要求",
  },
];
