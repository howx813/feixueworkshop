"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/data/content";
import { SnowflakeMark } from "@/components/SnowflakeMark";
import { ThemeSwitch } from "@/components/ThemeSwitch";

const nav = [
  {
    group: "内容",
    items: [
      {
        href: "/",
        label: "首页",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 10v10h14V10" />
          </svg>
        ),
      },
      {
        href: "/showcase/",
        label: "能力展厅",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        ),
      },
      {
        href: "/insights/",
        label: "观点精选",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
      {
        href: "/music/",
        label: "工坊电台",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        ),
      },
      {
        href: "/lab/",
        label: "手搓宝匣",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8V21H3V8" />
            <path d="M1 3h22v5H1z" />
            <path d="M10 12h4" />
          </svg>
        ),
      },
      {
        href: "/tenders/",
        label: "每日标讯",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" />
            <path d="M8 9h8" />
            <path d="M8 13h6" />
            <path d="M8 17h4" />
          </svg>
        ),
      },
      {
        href: "/weekly/",
        label: "工作看板",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
            <path d="M8 15h4" />
          </svg>
        ),
      },
      {
        href: "/changelog/",
        label: "更新日志",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h6" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "互动",
    items: [
      {
        href: "/#contact",
        label: "联系",
        icon: (
          <svg className="side-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" />
            <path d="m22 6-10 7L2 6" />
          </svg>
        ),
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname.startsWith(href.replace(/\/$/, ""));
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" aria-label="主导航">
      <Link href="/" className="sidebar-brand" aria-label={site.name}>
        <SnowflakeMark depth={3} sides={3} size={28} title="科赫雪花 · 经典三角" />
        <span className="brand-text">
          <span className="brand-name">{site.name}</span>
          <span className="brand-en">{site.nameEn}</span>
        </span>
      </Link>

      <div className="sidebar-divider" />

      <nav>
        {nav.map((group) => (
          <div key={group.group}>
            <div className="side-group">{group.group}</div>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`side-link${active ? " side-link-active" : ""}`}
                >
                  {item.icon}
                  <span className="side-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          {site.slogan}
          <br />
          个人作品展厅 · v0.1
        </div>
        <ThemeSwitch />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "首页" },
    { href: "/tenders/", label: "标讯" },
    { href: "/lab/", label: "手搓" },
    { href: "/weekly/", label: "工作" },
    { href: "/changelog/", label: "日志" },
  ];

  return (
    <nav className="mobile-nav" aria-label="底部导航">
      <div className="mobile-nav-inner">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Topbar() {
  return (
    <div className="topbar">
      <Link href="/" className="sidebar-brand" style={{ padding: 0 }}>
        <SnowflakeMark depth={3} sides={3} size={28} title="科赫雪花 · 经典三角" />
        <span className="brand-text">
          <span className="brand-name">{site.name}</span>
        </span>
      </Link>
      <ThemeSwitch compact />
    </div>
  );
}
