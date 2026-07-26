"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/data/content";
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
        <span className="brand-mark">雪</span>
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
    { href: "/showcase/", label: "展厅" },
    { href: "/music/", label: "电台" },
    { href: "/insights/", label: "观点" },
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
        <span className="brand-mark">雪</span>
        <span className="brand-text">
          <span className="brand-name">{site.name}</span>
        </span>
      </Link>
      <ThemeSwitch compact />
    </div>
  );
}
