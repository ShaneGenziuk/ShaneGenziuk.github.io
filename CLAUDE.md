# CLAUDE.md

## Project Overview

**ShaneGenziuk.github.io** — A GitHub Pages static site for the Haiku Builder project.

This is a plain static site hosted via GitHub Pages. There are no build tools, bundlers, or server-side frameworks.

## Repository Structure

```
ShaneGenziuk.github.io/
├── README.md            # Project description
├── CLAUDE.md            # This file
└── .claude/
    ├── settings.json    # Claude Code hooks configuration
    └── hooks/
        └── session-start.sh  # SessionStart hook for Claude Code on the web
```

## Development

This is a static HTML/CSS/JS site. To add content:
- Add HTML files to the repository root or subdirectories.
- GitHub Pages automatically serves the site from the `main` branch at `https://shanegenziuk.github.io`.

## Linting and Tests

No linter or test framework is configured. This is a bare static site with no dependencies.

## Git Workflow

- Default branch: `main`
- Feature/agent branches follow the pattern: `claude/<description>-<id>`
- Push changes to the appropriate branch and open a pull request against `main`.

## Session Start Hook

A `.claude/hooks/session-start.sh` hook is registered for Claude Code on the web sessions. Since there are no dependencies to install, the hook exits immediately when running remotely.
