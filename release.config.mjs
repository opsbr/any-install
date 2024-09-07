/**
 * @type {import('semantic-release').Options}
 */
export default {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { breaking: true, release: "major" },
          { revert: true, release: "patch" },
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "build", scope: "deps", release: "patch" },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Features" },
            { type: "feature", section: "Features" },
            { type: "fix", section: "Bug Fixes" },
            { type: "perf", section: "Performance Improvements" },
            { type: "revert", section: "Reverts" },
            { type: "refactor", section: "Code Refactoring" },
            { type: "test", section: "Tests" },
            { type: "build", section: "Build System" },
            { type: "ci", section: "Continuous Integration" },
            { type: "docs", section: "Documentation" },
            { type: "style", section: "Styles" },
            { type: "chore", section: "Miscellaneous Chores" },
          ],
        },
      },
    ],
    [
      "@semantic-release/npm",
      {
        tarballDir: "./dist/release",
      },
    ],
    [
      "@semantic-release/exec",
      {
        publishCmd: "bun build-assets ./dist/release",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: ["./dist/release/*"],
        draftRelease: true,
        successComment:
          "Released by [${ nextRelease.gitTag }](https://github.com/opsbr/any-install/releases/tag/${ nextRelease.gitTag })",
      },
    ],
  ],
};
