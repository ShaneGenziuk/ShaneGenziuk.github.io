# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This is a GitHub Pages site for **Haiku Builder** — a web-based tool for creating haiku poems.

Repository: `ShaneGenziuk/ShaneGenziuk.github.io`
Deployed at: `https://shanegenziuk.github.io`

## Repository Structure

```
ShaneGenziuk.github.io/
├── CLAUDE.md       # This file
└── README.md       # Project description
```

This repository is in early development. As the project grows, this file should be updated to reflect the actual structure and tooling.

## Development Guidelines

### Git Workflow

- Default branch: `main` (GitHub Pages deployment branch)
- Feature branches: use descriptive names, e.g. `feature/haiku-editor` or `fix/layout-bug`
- Commit messages should be clear and descriptive

### GitHub Pages

- The site is served directly from the `main` branch
- No build step is currently configured
- If a static site generator (e.g. Jekyll, Hugo) is added later, update this file with build instructions

### Common Commands

As the project matures and tooling is added, document commands here. For example:

```bash
# Example for a future Jekyll setup
bundle install       # Install Ruby dependencies
bundle exec jekyll serve  # Run local dev server at http://localhost:4000
bundle exec jekyll build  # Build the static site
```

## Notes for Claude

- This project is minimal/greenfield — avoid over-engineering
- Keep the site simple, fast, and accessible
- When adding dependencies, prefer lightweight options suitable for a GitHub Pages static site
- Update this CLAUDE.md as the project structure and tooling evolve
