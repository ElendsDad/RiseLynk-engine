import { iconPaths } from "@/lib/icons.mjs";

// The frame every built-in icon renders inside (feedback item #12). Server component,
// no client JS: a plain inline SVG stroked in currentColor, mirroring the StarRating
// pattern (lib/icons.mjs holds the path data, this component draws it). An unknown or
// misspelled name renders nothing (fail-safe), never a broken icon.
export default function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const paths = iconPaths(name);
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d: string, i: number) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
