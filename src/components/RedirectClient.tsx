"use client";

import Link from "next/link";
import { useEffect } from "react";

type Props = {
  href: string;
  label?: string;
};

export function RedirectClient({ href, label }: Props) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <div className="page">
      <p className="page-kicker">Redirect</p>
      <h1 className="page-title">{label || "页面已移动"}</h1>
      <p className="page-desc">
        正在跳转……若未自动跳转，请点：{" "}
        <Link href={href} className="link-accent">
          {href}
        </Link>
      </p>
    </div>
  );
}
