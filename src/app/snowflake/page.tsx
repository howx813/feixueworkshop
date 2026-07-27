import type { Metadata } from "next";
import { RedirectClient } from "@/components/RedirectClient";

export const metadata: Metadata = {
  title: "雪花函数",
  description: "已迁至手搓宝匣",
};

/** 旧路径兼容 → /lab/snowflake/ */
export default function SnowflakeRedirectPage() {
  return (
    <RedirectClient href="/lab/snowflake/" label="雪花函数已收入「手搓宝匣」" />
  );
}
