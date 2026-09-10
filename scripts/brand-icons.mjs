// Regenerates components/BrandIcons.tsx from the official simple-icons artwork, so
// the paths are never redrawn by hand. Run with: node scripts/brand-icons.mjs
import { writeFileSync } from "node:fs";
import * as si from "simple-icons";

const MARKS = [
  ["GitHubMark", "siGithub", "currentColor"],
  ["VercelMark", "siVercel", "currentColor"],
  ["NextMark", "siNextdotjs", "currentColor"],
  ["ChromeMark", "siGooglechrome", "#4285F4"],
  ["RustMark", "siRust", "currentColor"],
  ["SwiftMark", "siSwift", "#F05138"],
];

const header = `// Brand marks. Every path below is the official artwork from the simple-icons
// project (CC0), copied verbatim rather than redrawn, so the geometry is exact.
// Do not edit by hand: regenerate with \`node scripts/brand-icons.mjs\`.
// The marks label the technology each option targets, which is nominative use.

type Props = { className?: string };

const base = "size-4 shrink-0";
`;

const body = MARKS.map(([name, key, fill]) => {
  const icon = si[key];
  if (!icon) throw new Error(`simple-icons is missing ${key}`);
  return `
/** ${icon.title} */
export function ${name}({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="${fill}" className={className} aria-hidden focusable="false">
      <path d="${icon.path}" />
    </svg>
  );
}`;
}).join("\n");

const local = `

/** The local-apps dashboard: 4 linked nodes. A personal app, so there is no official mark. */
export function LocalAppsMark({ className = base }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden focusable="false">
      <path d="M9 6.5h6M6.5 9v6M17.5 9v6M9 17.5h6" strokeLinecap="round" />
      <rect x="2.5" y="2.5" width="8" height="8" rx="2.4" />
      <rect x="13.5" y="2.5" width="8" height="8" rx="2.4" />
      <rect x="2.5" y="13.5" width="8" height="8" rx="2.4" />
      <rect x="13.5" y="13.5" width="8" height="8" rx="2.4" />
    </svg>
  );
}
`;

writeFileSync(new URL("../components/BrandIcons.tsx", import.meta.url), header + body + local);
console.log(`BrandIcons.tsx regenerated: ${MARKS.map((m) => m[0]).join(", ")}, LocalAppsMark`);
