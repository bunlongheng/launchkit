export type AppType = "web" | "chrome" | "tui" | "native";

export type Features = {
  openSource: boolean;
  deploy: boolean;
  isPublic: boolean;
  auth: boolean;
  audit: boolean;
  onboard: boolean;
};

export type PromptInput = {
  name: string;
  description: string;
  features: Features;
  appType: AppType;
};

export const NAME_MAX = 40;
// 500 was far too tight: a real 1,745 character description was silently truncated
// mid-word by the browser on paste. Generous now, still bounded.
export const DESCRIPTION_MAX = 4000;

export const slugify = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// The app type decides the stack, so there is nothing separate to pick.
export const APP_TYPES: { key: AppType; label: string; stack: string }[] = [
  { key: "web", label: "Web App", stack: "Next.js" },
  { key: "chrome", label: "Chrome Extension", stack: "TypeScript, MV3" },
  { key: "tui", label: "TUI", stack: "Rust" },
  { key: "native", label: "Native", stack: "Swift" },
];

export const appTypeFor = (key: AppType) => APP_TYPES.find((a) => a.key === key)!;

// Everything on by default except auth: most apps want the full ship pipeline, and
// far from every app needs a login.
export const DEFAULT_FEATURES: Features = {
  openSource: true,
  deploy: true,
  isPublic: true,
  audit: true,
  onboard: true,
  auth: false,
};

// The 4 toggles that map onto a real Claude Code skill. Listed in the order the
// skills should actually run, which is not the order the switches appear in.
export const SKILL_COMMANDS: { key: keyof Features; command: string }[] = [
  { key: "onboard", command: "/onboard" },
  { key: "audit", command: "/repo-audit" },
  { key: "isPublic", command: "/repo-public-audit" },
  { key: "openSource", command: "/repo-open-source-audit" },
];

export const skillFor = (key: keyof Features): string | undefined =>
  SKILL_COMMANDS.find((s) => s.key === key)?.command;

export const skillsFor = (features: Features): string[] =>
  SKILL_COMMANDS.filter(({ key }) => features[key]).map(({ command }) => command);

const yesNo = (v: boolean) => (v ? "Yes" : "No");

const REQUIREMENTS = [
  "Use clean, production-quality TypeScript",
  "Keep architecture simple and scalable",
  "Avoid duplicate code",
  "Avoid unnecessary abstractions",
  "Reuse components where appropriate",
  "Use secure defaults",
  "Validate inputs",
  "Handle errors properly",
  "Make the UI fully responsive on phone, tablet and desktop",
  "Keep dependencies minimal",
];

const AUDIT = [
  "Review security",
  "Performance",
  "Accessibility",
  "Maintainability",
  "Dependency issues",
  "Dead code",
  "Duplicate code",
];

const ONBOARD = [
  "Register the app in the local apps dashboard with its port, repo and start command",
  "Give it a tab colour and icon to match the alias that already exists",
  "Link the project to its deployment target",
  "Generate the app icon and a baseline screenshot",
];

const AUTH = [
  "Add authentication with secure, httpOnly session cookies",
  "Hash and salt any stored credentials",
  "Protect every non-public route and API handler on the server, not just in the UI",
  "Keep secrets and tokens out of client-side code",
];

const OPEN_SOURCE = [
  "Make the existing repository public once it is safe to",
  "Add an MIT LICENSE file",
  "Write a README covering setup, usage and project layout",
  "Document every required environment variable and keep real values out of the repository",
];

const DEPLOY = [
  "Add production-ready deployment configuration for Vercel",
  "Include required environment variables",
  "Include build and start commands",
];

const BEFORE = [
  "Inspect the project.",
  "Create a short implementation plan.",
  "Identify files that need to be created or modified.",
  "Then implement the solution.",
];

const AFTER = [
  "Run lint",
  "Run TypeScript checks",
  "Run tests if available",
  "Fix errors",
  "Check the UI at phone, tablet and desktop widths",
  "Audit the result, fix what it finds, and loop until it grades A+",
  "Summarize what changed",
];

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
const numbered = (items: string[]) =>
  items.map((i, n) => `${n + 1}. ${i}`).join("\n");

// The tab alias is underscores only, never dashes: it is used as a shell function
// name, and a dash is not valid there.
export const aliasFor = (name: string) =>
  `_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;

/** Step 1. Run in the current tab, then stop and hand off. */
export function buildSetupPrompt(name: string, isPublic: boolean): string {
  const alias = aliasFor(name);
  return [
    `appName = ${name.trim()}`,
    `Set up a new project for me. Do this part only.`,
    numbered([
      isPublic
        ? "Create a new GitHub repo for it. Make it private for now; it goes public later, once the pre-public scan has passed."
        : "Create a new private GitHub repo for it.",
      `Add a shell function \`${alias}\` to my Claude tab aliases file, following the pattern already in there, so it opens a terminal tab for \`${slugify(name)}\`. Register the tab colour and icon alongside it if that file's convention has them.`,
      `Open a NEW terminal tab and run \`${alias}\` to confirm it works. It will not resolve in this shell until the aliases file is re-sourced, which a new tab does for you.`,
    ]),
    "Do not build anything yet. Once that tab is open, stop and tell me it is ready. I will paste the build prompt into it, so the work is reported under that session rather than this one.",
  ].join("\n\n");
}

/** Step 2. Paste into the tab step 1 opened. */
export function buildPrompt({ name, description, features, appType }: PromptInput): string {
  const sections: string[] = [
    `appName = ${name.trim()}`,
    `Build the following application:\n\n${description.trim()}`,
    `Configuration:\n${bullets([
      `Open source: ${yesNo(features.openSource)}`,
      `Deploy: ${yesNo(features.deploy)}`,
      `Visibility: ${features.isPublic ? "Public" : "Private"}`,
      `Authentication: ${yesNo(features.auth)}`,
      `Audit: ${yesNo(features.audit)}`,
      `Onboard into local apps: ${yesNo(features.onboard)}`,
      `App type: ${appTypeFor(appType).label}`,
      `Stack: ${appTypeFor(appType).stack}`,
    ])}`,
    `Requirements:\n${bullets(REQUIREMENTS)}`,
  ];

  if (features.audit) sections.push(`Audit:\n${bullets(AUDIT)}`);
  if (features.onboard) sections.push(`Onboard local app:\n${bullets(ONBOARD)}`);
  if (features.auth) sections.push(`Authentication:\n${bullets(AUTH)}`);
  if (features.deploy) sections.push(`Deploy:\n${bullets(DEPLOY)}`);
  if (features.openSource) sections.push(`Open source:\n${bullets(OPEN_SOURCE)}`);

  sections.push(`Before coding:\n${numbered(BEFORE)}`, `After coding:\n${bullets(AFTER)}`);

  const skills = skillsFor(features);
  if (skills.length) sections.push(`Skills to run, in order:\n${numbered(skills)}`);

  return sections.join("\n\n");
}
