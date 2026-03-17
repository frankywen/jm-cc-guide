# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] - 2026-03-17

### Fixed
- `init` command no longer overwrites existing CLAUDE.md with full guide
- Creates minimal template for new projects instead of copying full documentation
- Only adds skill reference to existing CLAUDE.md, preserving original content

## [1.1.3] - 2026-03-17

### Fixed
- Restored Node.js 18 compatibility by downgrading inquirer to v8
- Fixed `getSourceDir()` path resolution using `import.meta.url`

### Added
- E2E tests for puzzle-classroom demo using Playwright
- Answer submission API endpoint for puzzle-classroom backend

### Changed
- Reverted dependency versions for Node.js 18 support:
  - `inquirer` 13.3.2 → 8.2.6
  - `commander` 14.0.3 → 11.1.0
  - `jest` 30.3.0 → 29.7.0

## [1.1.2] - 2026-03-17

### Documentation
- Updated demo/README.md with v1.1.1 features and new commands
- Added Node.js >= 20.0.0 requirement troubleshooting

## [1.1.1] - 2026-03-17

### Changed
- Updated Node.js engine requirement from `>=18.0.0` to `>=20.0.0`

### Dependencies
- `commander` 11.1.0 → 14.0.3
- `inquirer` 9.3.8 → 13.3.2
- `jest` 29.7.0 → 30.3.0

### CI/CD
- Updated GitHub Actions to latest versions (checkout@v6, setup-node@v6, codecov@v5)
- Removed Node.js 18.x from CI test matrix

## [1.1.0] - 2026-03-16

### Added

#### MCP Server Integration Examples
- Added comprehensive MCP Server configuration examples
- Filesystem, database, and API integration patterns
- Custom MCP server implementation guide

#### Hooks Examples
- PreToolUse hook for command security validation
- PostToolUse hook for auto-formatting
- PrePromptSubmit hook for sensitive data detection
- Notification hook for desktop notifications

#### Agent SDK Extension
- New `agent-sdk` extension package
- Basic agent template
- Tool-calling agent template
- Multi-agent collaboration template
- Human-in-the-loop agent template

#### Multi-Model Support
- `--models` flag for `init` command
- GEMINI.md template for Gemini CLI
- AGENTS.md template for multi-model projects

#### CLI Enhancements
- `config` command for configuration management
- `interactive` command for TUI mode
- `sync` command for upstream updates
- Config file support (~/.cc-guiderc.json)

#### Internationalization
- i18n module with zh-CN and en-US locales
- `--lang` option for language selection

### Changed
- Updated development skill with MCP and Hooks sections
- Enhanced init command with multi-model support
- Improved package-manager with agent-sdk package

## [1.0.0] - 2026-03-16

### Added
- Initial release
- Core knowledge base (CLAUDE.md)
- Extension packages (development, workflows, beginner-cn)
- CLI tool with init, add, list, doctor, update commands
- Conflict detection using Levenshtein distance
- Content merging with HTML comment markers
- GitHub Actions CI/CD
- Dependabot configuration
- Issue and PR templates
- CONTRIBUTING.md

### Skills
- core: Basic concepts and best practices
- development: Documentation skills, dev templates
- workflows: End-to-end development workflows
- beginner-cn: Chinese beginner tutorial

### CLI Commands
- `init`: Initialize project configuration
- `add`: Add extension packages
- `list`: List available packages
- `doctor`: Diagnose configuration issues
- `update`: Update to latest version