# Security Policy

## Scope

This repository contains **Claude Code skills** — curated documentation, templates, and reference materials. Skills are not executable services; they provide guidance and code examples that developers use within Claude Code.

## Reporting a Vulnerability

If you discover a security issue in this repository, please report it responsibly:

1. **GitHub Security Advisories** (preferred): Use [GitHub Security Advisories](https://github.com/flaremity/skills/security/advisories/new) to report privately.
2. **GitHub Issues**: For non-sensitive issues (e.g., exposed example credentials in templates), open a [regular issue](https://github.com/flaremity/skills/issues/new).

### What to Include

- Description of the vulnerability
- Steps to reproduce (if applicable)
- Which skill or file is affected
- Potential impact

### Response Timeline

- **Acknowledgment**: Within 3 business days
- **Assessment**: Within 7 business days
- **Fix**: Dependent on severity, typically within 14 days

## What Qualifies

Since this repository contains documentation and templates (not runtime services), security concerns typically involve:

- Sensitive data (API keys, tokens, credentials) accidentally included in templates or examples
- Code examples that demonstrate insecure patterns without adequate warnings
- Supply chain concerns in recommended dependencies

## What Does NOT Qualify

- Vulnerabilities in third-party tools or libraries referenced in documentation
- Vulnerabilities in Claude Code itself (report those to [Anthropic](https://www.anthropic.com))
- Theoretical issues with no practical impact

Thank you for helping keep Flaremity Skills safe.
