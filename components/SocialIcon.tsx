import { socialIconPaths } from "@/lib/social-icons.mjs";

// The frame every built-in social icon renders inside. Server component, no client JS: a
// plain inline SVG stroked in currentColor, mirroring components/Icon.tsx (lib/social-icons.mjs
// holds the path data, this component draws it). socialIconPaths always resolves to real path
// data (the generic "link" glyph for an unrecognized platform), so this never renders empty.
export default function SocialIcon({ platform, size = 18 }: { platform: string; size?: number }) {
  const paths = socialIconPaths(platform);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
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
