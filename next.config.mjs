/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.EXPORT === "1" ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
