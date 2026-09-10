export type Stack = "nextjs" | "other";

export type Features = {
  openSource: boolean;
  deploy: boolean;
  isPublic: boolean;
  auth: boolean;
  audit: boolean;
  onboard: boolean;
};

export type PromptInput = {
  description: string;
  features: Features;
  stack: Stack;
};

export const DESCRIPTION_MAX = 500;

export const STACK_LABELS: Record<Stack, string> = {
  nextjs: "Next.js",
  other: "Other",
};

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
  "Make the UI responsive",
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
  "Inspect the existing repository first",
  "Understand architecture, dependencies, scripts, environment variables, conventions, and important flows",
  "Reuse existing patterns before introducing new ones",
  "Do not rewrite working parts unnecessarily",
];

const AUTH = [
  "Add authentication with secure, httpOnly session cookies",
  "Hash and salt any stored credentials",
  "Protect every non-public route and API handler on the server, not just in the UI",
  "Keep secrets and tokens out of client-side code",
];

const OPEN_SOURCE = [
  "Add an MIT LICENSE file",
  "Write a README covering setup, usage and project layout",
  "Document every required environment variable and keep real values out of the repository",
];

const DEPLOY = [
  "Add production-ready deployment configuration",
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
  "Summarize what changed",
];

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
const numbered = (items: string[]) =>
  items.map((i, n) => `${n + 1}. ${i}`).join("\n");

export function buildPrompt({ description, features, stack }: PromptInput): string {
  const sections: string[] = [
    `Build the following application:\n\n${description.trim()}`,
    `Configuration:\n${bullets([
      `Open source: ${yesNo(features.openSource)}`,
      `Deploy: ${yesNo(features.deploy)}`,
      `Visibility: ${features.isPublic ? "Public" : "Private"}`,
      `Authentication: ${yesNo(features.auth)}`,
      `Audit: ${yesNo(features.audit)}`,
      `Onboard existing local app: ${yesNo(features.onboard)}`,
      `Stack: ${STACK_LABELS[stack]}`,
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
