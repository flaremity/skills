# Contributing to Flaremity Skills

Thank you for your interest in contributing! This guide will help you get started.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/flaremity/skills/issues) to avoid duplicates
2. Open a [bug report](https://github.com/flaremity/skills/issues/new?template=bug_report.md)
3. Include the skill name, expected behavior, and actual behavior

### Suggesting Features

1. Open a [feature request](https://github.com/flaremity/skills/issues/new?template=feature_request.md)
2. Describe the skill or improvement you'd like to see

### Adding a New Skill

1. **Fork** the repository
2. **Create** a directory: `skills/<your-skill-name>/`
3. **Add required files:**
   - `SKILL.md` — main skill reference with frontmatter (`name`, `description`, `user_invocable`)
   - `.claude-plugin/plugin.json` — plugin manifest (name, version, description, author, keywords)
   - `LICENSE` — MIT preferred
   - `README.md` — skill documentation with installation instructions
4. **Add optional directories** as needed:
   - `rules/` — auto-correction rules
   - `templates/` — code examples
   - `references/` — deep-dive guides
   - `scripts/` — utility scripts
5. **Update** root files:
   - `.claude-plugin/marketplace.json` — add your skill to the plugins array
   - `README.md` — add to the Available Skills table
   - `CHANGELOG.md` — add entry under Unreleased
6. **Submit** a pull request

### Improving Existing Skills

1. Fork the repository
2. Make your changes
3. Test that SKILL.md frontmatter parses correctly
4. Submit a pull request with a clear description of improvements

## Pull Request Process

1. Use a descriptive title following [Conventional Commits](https://www.conventionalcommits.org/)
2. Fill out the PR template
3. Ensure all JSON files are valid
4. Ensure SKILL.md has required frontmatter fields
5. Wait for review — maintainers will respond within a few days

## Code Style

- Markdown: use ATX-style headers (`#`), fenced code blocks with language tags
- JSON: 2-space indentation
- File names: `kebab-case`
- Commit messages: English, conventional commits format

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.
