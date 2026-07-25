// IBM Equal Access accessibility-checker config (Apache-2.0).
// Policy: WCAG 2.2 (A, AA). Fail the gate on definite violations only.
// Automated scanning catches roughly a third of WCAG issues — a floor, not a defense.
// Never claim a site "is accessible"; report what was scanned and what passed.
module.exports = {
  ruleArchive: "latest",
  policies: ["WCAG_2_2"],
  failLevels: ["violation"],
  reportLevels: ["violation", "potentialviolation"],
  outputFormat: ["json"],
  outputFilenameTimestamp: false,
  outputFolder: ".a11y-results",
  baselineFolder: ".a11y-baselines",
  puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
};
