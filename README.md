# Flaremity Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-1-brightgreen.svg)](#available-skills)

Curated [Claude Code](https://claude.ai/code) skills for AI agent development.

## Available Skills

| Skill | Description | Version |
|-------|-------------|---------|
| [claude-agent-sdk-ts](skills/claude-agent-sdk-ts/) | TypeScript reference for `@anthropic-ai/claude-agent-sdk` — build AI agents with Claude Code | `0.2.56` |

## Quick Install

### Plugin Marketplace

```bash
# Add the Flaremity marketplace
/plugin marketplace add flaremity/skills

# Install the skill
/plugin install claude-agent-sdk-ts@flaremity
```

### Manual Install (Git Clone)

```bash
# Clone into your Claude Code skills directory
cd ~/.claude/skills/
git clone https://github.com/flaremity/skills.git flaremity

# Or clone a single skill
cd ~/.claude/skills/
mkdir -p flaremity
cd flaremity
git init
git remote add origin https://github.com/flaremity/skills.git
git sparse-checkout init --cone
git sparse-checkout set skills/claude-agent-sdk-ts
git pull origin main
```

## Directory Structure

```
skills/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest
├── skills/
│   └── claude-agent-sdk-ts/      # Claude Agent SDK skill
│       ├── .claude-plugin/
│       │   └── plugin.json       # Plugin manifest
│       ├── SKILL.md              # Main skill reference
│       ├── rules/                # Auto-correction rules
│       ├── templates/            # Ready-to-use examples
│       ├── references/           # Deep-dive guides
│       ├── scripts/              # Utility scripts
│       ├── LICENSE
│       └── README.md
├── CLAUDE.md                     # Dev instructions for Claude Code
├── CONTRIBUTING.md               # Contribution guidelines
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
├── LICENSE
└── README.md                     # This file
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Adding new skills
- Improving existing skills
- Reporting bugs and requesting features

## License

[MIT](LICENSE) — Copyright (c) 2025 Flaremity

Individual skills may have their own licenses. Check each skill's directory for details.
