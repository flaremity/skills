# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Development instructions for the Flaremity Skills repository.

## Repository Structure

This is a **Claude Code skills marketplace** — a collection of curated skills that can be installed into Claude Code.

```
.claude-plugin/marketplace.json       # Marketplace manifest (lists all skills)
skills/<skill-name>/                  # Each skill in its own directory
├── .claude-plugin/plugin.json        # Plugin manifest
├── SKILL.md                          # Main skill file (required)
├── rules/                            # Auto-correction rules (optional)
├── templates/                        # Code templates (optional)
├── references/                       # Reference docs (optional)
├── scripts/                          # Utility scripts (optional)
├── LICENSE                           # Skill-specific license
└── README.md                         # Skill documentation
```

## Adding a New Skill

1. Create `skills/<skill-name>/` directory
2. Create `SKILL.md` with frontmatter:
   ```yaml
   ---
   name: <skill-name>
   description: |
     Short description. Keywords: keyword1, keyword2, ...
   user_invocable: true
   ---
   ```
3. Create `.claude-plugin/plugin.json` with name, version, description, author, keywords
4. Add the skill to root `.claude-plugin/marketplace.json` plugins array
   - **Important:** Keep `name` and `version` in `plugin.json` in sync with the corresponding entry in `marketplace.json`
5. Add a `LICENSE` file (MIT preferred)
6. Add a `README.md` with installation instructions
7. Update root `README.md` Available Skills table

## Naming Conventions

- Skill directories: `kebab-case` (e.g., `claude-agent-sdk-ts`)
- SKILL.md name field must match directory name
- Rule files: `<skill-name>.md` inside `rules/`
- Template files: `descriptive-name.ts` (or appropriate extension)

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add <skill-name> skill` — new skill
- `fix: correct <issue> in <skill-name>` — bug fix
- `docs: update README` — documentation only
- `chore: update marketplace manifest` — maintenance

## Validation

```bash
# Validate marketplace manifest
python3 -m json.tool < .claude-plugin/marketplace.json > /dev/null

# Validate a skill's plugin manifest
python3 -m json.tool < skills/<skill-name>/.claude-plugin/plugin.json > /dev/null
```

## Testing

- Verify JSON files parse correctly (see Validation section above)
- Verify SKILL.md frontmatter has required fields (name, description)
- Verify marketplace.json lists the skill
- Verify plugin.json name/version matches marketplace entry
