/** @type {import('next').NextConfig} */
const isExport = process.env.EXPORT === "1";

const nextConfig = {
  // 生产导出与 dev 使用不同 distDir，避免 build 弄脏 dev 的 .next（948.js / CSS 失效）
  distDir: isExport ? ".next-export" : ".next",
  ...(isExport ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
