import { kochSnowflakePath } from "@/lib/koch-snowflake";

type Props = {
  /** Koch 迭代深度，导航图标用 2–3 */
  depth?: number;
  /** 基底边数，默认 6（六角） */
  sides?: number;
  size?: number;
  className?: string;
  title?: string;
};

/**
 * 科赫雪花数学生成的品牌标（默认经典三角 Koch，候选 C）
 * path = KochSnowflake(depth, sides=3)
 */
export function SnowflakeMark({
  depth = 3,
  sides = 3,
  size = 28,
  className = "brand-mark",
  title = "科赫雪花 · 经典三角",
}: Props) {
  // 三角基底半径略大，小尺寸更饱满
  const radius = sides === 3 ? 38 : 36;
  const d = kochSnowflakePath(depth, 50, 52, radius, sides);

  return (
    <span className={className} aria-hidden={title ? undefined : true}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <rect
          width="100"
          height="100"
          rx="22"
          fill="var(--brand-mark-bg, transparent)"
        />
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
