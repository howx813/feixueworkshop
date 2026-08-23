"use client";

export type LabIconKey =
  | "gravity"
  | "fluid"
  | "particles"
  | "graphic"
  | "marble"
  | "snowflake"
  | "life"
  | "fourier"
  | "spectrum"
  | "particle-life"
  | "time-illusion"
  | "ai-2048"
  | "pagoda"
  | "living-room"
  | "text-drop"
  | "tender-galaxy";

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
    case "particle-life":
      return (
        <svg {...svgProps}>
          <circle cx="7" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="14" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="6" cy="15" r="1.2" fill="currentColor" stroke="none" />
          <path d="M8 9c2 1 4 2 5 4" opacity={0.7} />
          <path d="M15 8c1 2 2 3 2 5" opacity={0.7} />
        </svg>
      );
    case "time-illusion":
      return (
        <svg {...svgProps}>
          <path d="M12 3l6.5 4.2v5.6L12 17l-6.5-4.2V7.2L12 3z" />
          <path d="M12 8.5l3.2 2.1v2.8L12 15.5l-3.2-2.1v-2.8L12 8.5z" opacity={0.55} />
          <circle cx="18.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="5.2" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "ai-2048":
      return (
        <svg {...svgProps}>
          <rect x="4" y="4" width="7" height="7" rx="1.2" />
          <rect x="13" y="4" width="7" height="7" rx="1.2" opacity={0.55} />
          <rect x="4" y="13" width="7" height="7" rx="1.2" opacity={0.55} />
          <rect x="13" y="13" width="7" height="7" rx="1.2" />
          <circle cx="16.5" cy="16.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "pagoda":
      return (
        <svg {...svgProps}>
          <path d="M12 3l7 5h-14l7-5z" />
          <path d="M6 10h12v3H6z" opacity={0.75} />
          <path d="M4 15l8-2.5 8 2.5" />
          <path d="M7 16h10v4H7z" opacity={0.75} />
          <path d="M11 20h2v2h-2z" />
        </svg>
      );
    case "living-room":
      return (
        <svg {...svgProps}>
          <rect x="4" y="6" width="16" height="9" rx="1" />
          <rect x="7" y="8.4" width="10" height="4.2" rx="0.6" fill="currentColor" stroke="none" opacity={0.85} />
          <path d="M6 18h12M9 15v3M15 15v3" />
        </svg>
      );
    case "text-drop":
      return (
        <svg {...svgProps}>
          <text x="5" y="10" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">字</text>
          <text x="14" y="18" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none" opacity={0.7}>落</text>
          <path d="M6 20 L12 13" strokeWidth="1.2" opacity={0.6} />
          <path d="M4 21h16" strokeLinecap="round" />
        </svg>
      );
    case "tender-galaxy":
      return (
        <svg {...svgProps}>
          <circle cx="8" cy="9" r="2.4" />
          <circle cx="17" cy="7" r="1.6" opacity={0.75} />
          <circle cx="14" cy="15" r="1.3" opacity={0.55} />
          <path d="M8 9 L17 7 M8 9 L14 15" strokeWidth="0.8" opacity={0.45} />
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
    case "life":
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="7" cy="8" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17" cy="9" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="9" cy="17" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="16" r="1.2" fill="currentColor" stroke="none" />
          <path d="M8.2 9.2l2.8 2" strokeDasharray="1.5 1.5" />
          <path d="M15.8 9.8l-2.8 1.5" strokeDasharray="1.5 1.5" />
          <path d="M10 15.5l3 0.5" strokeDasharray="1.5 1.5" />
        </svg>
      );
    case "fourier":
      return (
        <svg {...svgProps}>
          <path d="M2 12c2 0 2-6 4-6s2 12 4 12 2-12 4-12 2 6 4 6" />
          <path d="M16 20v-3" />
          <path d="M19 20v-6" />
          <path d="M22 20v-9" />
        </svg>
      );
    case "spectrum":
      return (
        <svg {...svgProps}>
          <path d="M4 20v-4" />
          <path d="M8 20v-8" />
          <path d="M12 20v-12" />
          <path d="M16 20v-9" />
          <path d="M20 20v-14" />
        </svg>
      );
    default:
      return null;
  }
}
