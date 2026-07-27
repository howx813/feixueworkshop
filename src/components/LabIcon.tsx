"use client";

export type LabIconKey =
  | "gravity"
  | "fluid"
  | "particles"
  | "graphic"
  | "marble"
  | "snowflake";

type Props = {
  id: LabIconKey;
  size?: number;
  className?: string;
};

const baseStyle = {
  display: "inline-block",
  flexShrink: 0,
} as const;

export function LabIcon({ id, size = 20, className }: Props) {
  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: baseStyle,
    className,
    "aria-hidden": true,
  };

  switch (id) {
    case "gravity":
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
          <ellipse cx="12" cy="12" rx="9" ry="4.2" />
          <circle cx="19.6" cy="9.4" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "fluid":
      return (
        <svg {...svgProps}>
          <path d="M2 14c0-3 3-9 6-10 1.5 3 1.5 9 0 12" />
          <path d="M12 16c0-4 2.5-10 5-11 1.5 3 1.5 9 0 12" />
          <path d="M6 20c2.5 2 5.5 2 8 0" />
        </svg>
      );
    case "particles":
      return (
        <svg {...svgProps}>
          <circle cx="6" cy="6" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="18" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="10" cy="18" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="20" cy="18" r="1" fill="currentColor" stroke="none" />
          <circle cx="6" cy="14" r="1" fill="currentColor" stroke="none" />
          <path d="M7.5 6.5l8 2" strokeDasharray="2 2" />
          <path d="M11 17l6-8" strokeDasharray="2 2" />
        </svg>
      );
    case "graphic":
      return (
        <svg {...svgProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="M3 17l5-5 4 4 3-3 6 6" />
        </svg>
      );
    case "marble":
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="10" cy="10" r="2.2" fill="currentColor" stroke="none" />
          <path d="M12 4v3" />
          <path d="M12 17v3" />
          <path d="M4 12h3" />
          <path d="M17 12h3" />
        </svg>
      );
    case "snowflake":
      return (
        <svg {...svgProps}>
          <path d="M12 3v18" />
          <path d="M5.6 7l12.8 10" />
          <path d="M5.6 17L18.4 7" />
          <path d="M12 6l2.5-1.5L12 3l-2.5 1.5L12 6z" />
          <path d="M12 18l2.5 1.5L12 21l-2.5-1.5L12 18z" />
          <path d="M6.3 12.8l-1.5 2.5-1.5-2.5 1.5-2.5 1.5 2.5z" />
          <path d="M17.7 12.8l1.5 2.5 1.5-2.5-1.5-2.5-1.5 2.5z" />
        </svg>
      );
    default:
      return null;
  }
}
