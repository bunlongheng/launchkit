export type Stack = "nextjs" | "vite" | "other";

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
  vite: "React / Vite",
  other: "Other",
};

export const DEFAULT_FEATURES: Features = {
  openSource: false,
  deploy: true,
  isPublic: true,
  auth: false,
  audit: false,
  onboard: false,
};

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
  if (features.deploy) sections.push(`Deploy:\n${bullets(DEPLOY)}`);

  sections.push(`Before coding:\n${numbered(BEFORE)}`, `After coding:\n${bullets(AFTER)}`);

  return sections.join("\n\n");
}
