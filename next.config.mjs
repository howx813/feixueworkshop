/** @type {import('next').NextConfig} */
// 注意：正式导出构建请走 `npm run build` → scripts/build-export.mjs（隔离目录）。
// 本配置仅服务 next dev / 非 EXPORT 场景，避免与隔离构建抢同一套缓存。
const nextConfig = {
  distDir: ".next",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
