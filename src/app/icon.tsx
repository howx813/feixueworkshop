import { ImageResponse } from "next/og";
import { kochSnowflakePath } from "@/lib/koch-snowflake";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  const d = kochSnowflakePath(3, 256, 258, 194, 3);

  return new ImageResponse(
    (
      <svg
        width="512"
        height="512"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="512" height="512" rx="112" fill="#10151c" />
        <path
          d={d}
          fill="none"
          stroke="#4fa3b3"
          strokeWidth="14"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    ),
    {
      ...size,
    },
  );
}
