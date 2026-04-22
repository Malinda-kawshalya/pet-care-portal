const fs = require("node:fs");
const path = require("node:path");
const pa11y = require("pa11y");

const baseUrl = process.env.A11Y_BASE_URL || "http://localhost:3000";
const pagePaths = (process.env.A11Y_PATHS || "/,/about,/pets,/community,/login,/register")
  .split(",")
  .map((segment) => segment.trim())
  .filter(Boolean);
const standard = process.env.A11Y_STANDARD || "WCAG2AA";

async function run() {
  const pages = [];

  for (const pagePath of pagePaths) {
    const url = new URL(pagePath, `${baseUrl}/`).toString();

    try {
      const result = await pa11y(url, {
        standard,
        timeout: 30000,
        wait: 500,
      });

      pages.push({
        path: pagePath,
        url,
        issuesCount: result.issues.length,
        issues: result.issues.map((issue) => ({
          code: issue.code,
          type: issue.type,
          message: issue.message,
          selector: issue.selector,
          context: issue.context,
        })),
      });
    } catch (error) {
      pages.push({
        path: pagePath,
        url,
        issuesCount: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const totalIssues = pages.reduce(
    (sum, page) => sum + (typeof page.issuesCount === "number" ? page.issuesCount : 0),
    0
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    standard,
    pagesScanned: pages.length,
    pagesFailed: pages.filter((page) => Boolean(page.error)).length,
    totalIssues,
    pages,
  };

  const docsDir = path.resolve(__dirname, "../../docs");
  fs.mkdirSync(docsDir, { recursive: true });

  const jsonPath = path.join(docsDir, "a11y-automated-results.json");
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const markdownLines = [
    "# Automated Accessibility Report",
    "",
    `Generated: ${summary.generatedAt}`,
    `Base URL: ${summary.baseUrl}`,
    `Standard: ${summary.standard}`,
    `Pages scanned: ${summary.pagesScanned}`,
    `Pages failed: ${summary.pagesFailed}`,
    `Total issues: ${summary.totalIssues}`,
    "",
    "## Page Results",
    "",
    "| Page | Issues | Status |",
    "| --- | ---: | --- |",
    ...pages.map((page) => {
      if (page.error) {
        return `| ${page.path} | - | ERROR: ${page.error.replace(/\|/g, "\\|")} |`;
      }
      return `| ${page.path} | ${page.issuesCount} | OK |`;
    }),
    "",
  ];

  for (const page of pages) {
    if (!page.issues || !page.issues.length) {
      continue;
    }

    markdownLines.push(`## ${page.path}`);
    markdownLines.push("");

    for (const issue of page.issues.slice(0, 10)) {
      markdownLines.push(`- [${issue.type}] ${issue.code}: ${issue.message}`);
    }

    markdownLines.push("");
  }

  const markdownPath = path.join(docsDir, "A11Y_AUTOMATED_REPORT.md");
  fs.writeFileSync(markdownPath, markdownLines.join("\n"));

  console.log(`Automated accessibility report written to ${markdownPath}`);
  console.log(`Raw results written to ${jsonPath}`);
}

run().catch((error) => {
  console.error("Accessibility audit failed", error);
  process.exit(1);
});
