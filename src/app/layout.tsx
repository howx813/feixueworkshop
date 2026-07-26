import type { Metadata, Viewport } from "next";
import { MobileNav, Sidebar, Topbar } from "@/components/Sidebar";
import { site } from "@/data/content";
import { themeInitScript } from "@/lib/theme-init";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.slogan}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: ["飞雪工坊", "AI", "智能体", "数据智能", "工作流", "Feixue Workshop"],
  authors: [{ name: site.owner }],
  openGraph: {
    title: `${site.name} — ${site.slogan}`,
    description: site.description,
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f6" },
    { media: "(prefers-color-scheme: dark)", color: "#10151c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="main-wrap">
            <Topbar />
            {children}
          </div>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
