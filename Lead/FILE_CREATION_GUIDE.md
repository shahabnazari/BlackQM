# VQMethod File Creation Guide

## Overview

This guide explains how to create files that automatically follow repository standards.

## Quick Start

### Interactive File Creation

```bash
npm run create
```

This launches an interactive prompt to guide you through file creation.

### Direct File Creation

#### Frontend Components

```bash
npm run create:component Button          # Creates frontend/components/Button.tsx
npm run create:apple Card                # Creates frontend/components/apple-ui/Card.tsx
npm run create:page about                # Creates frontend/app/about/page.tsx
npm run create:hook useAuth              # Creates frontend/lib/hooks/useAuth.ts
```

#### Backend Modules

```bash
npm run create:module auth               # Creates backend/src/modules/auth/
npm run create:service user              # Creates backend/src/modules/user.service.ts
```

#### Tests

```bash
npm run create:test Button               # Creates appropriate test file
```

## File Creation CLI

### Usage

```bash
node scripts/create-file.js <type> <name> [subpath]
```

### Available File Types

| Type                 | Description            | Location                        | Naming                      |
| -------------------- | ---------------------- | ------------------------------- | --------------------------- |
| `react-component`    | React component        | `frontend/components/`          | PascalCase                  |
| `apple-ui-component` | Apple Design component | `frontend/components/apple-ui/` | PascalCase                  |
| `page`               | Next.js page           | `frontend/app/`                 | lowercase                   |
| `layout`             | Next.js layout         | `frontend/app/`                 | lowercase                   |
| `api-route`          | API route handler      | `frontend/app/api/`             | lowercase                   |
| `hook`               | Custom React hook      | `frontend/lib/hooks/`           | camelCase with 'use' prefix |
| `util`               | Utility function       | `frontend/lib/utils/`           | camelCase                   |
| `style`              | CSS stylesheet         | `frontend/styles/`              | kebab-case                  |
| `module`             | NestJS module          | `backend/src/modules/`          | kebab-case                  |
| `controller`         | NestJS controller      | `backend/src/modules/`          | kebab-case                  |
| `service`            | NestJS service         | `backend/src/modules/`          | kebab-case                  |
| `dto`                | NestJS DTO             | `backend/src/modules/`          | kebab-case                  |
| `entity`             | Database entity        | `backend/src/modules/`          | kebab-case                  |
| `guard`              | NestJS guard           | `backend/src/modules/`          | kebab-case                  |
| `test`               | Test file              | Auto-detected                   | Same as source              |
| `e2e-test`           | E2E test               | `frontend/e2e/`                 | kebab-case                  |
| `doc`                | Documentation          | `Lead/`                         | UPPER_SNAKE_CASE            |
| `script`             | Node.js script         | `scripts/`                      | kebab-case                  |
| `shell-script`       | Shell script           | `scripts/`                      | kebab-case                  |

### Examples

#### Create a React Component

```bash
node scripts/create-file.js react-component UserProfile
# Creates: frontend/components/UserProfile.tsx
```

#### Create an Apple UI Component

```bash
node scripts/create-file.js apple-ui-component Badge
# Creates: frontend/components/apple-ui/Badge.tsx
```

#### Create a NestJS Module

```bash
node scripts/create-file.js module authentication
# Creates: backend/src/modules/authentication/
#   - authentication.module.ts
#   - authentication.controller.ts
#   - authentication.service.ts
#   - dto/
```

#### Create a Custom Hook

```bash
node scripts/create-file.js hook useLocalStorage
# Creates: frontend/lib/hooks/useLocalStorage.ts
```

## File System Watcher

### Start Monitoring

```bash
npm run watch:files
```

The watcher will:

- Monitor file creation in real-time
- Alert on naming convention violations
- Warn about misplaced files
- Suggest fixes automatically

### What it Checks

1. **File Placement** - Ensures files are in correct directories
2. **Naming Conventions** - Validates file naming patterns
3. **Config Files** - Prevents configs in root directory
4. **Shell Scripts** - Ensures scripts are in scripts/ folder

## VS Code Integration

### Workspace Settings

The `.vscode/settings.json` includes:

- File nesting patterns for better organization
- Path intellisense mappings
- Format on save
- TypeScript workspace version

### Recommended Extensions

Install recommended extensions for best experience:

- Prettier
- ESLint
- Path Intellisense
- GitLens

## Automatic Organization

### Check for Misplaced Files

```bash
npm run organize:check
```

### Auto-Fix File Placement

```bash
npm run organize
```

## File Templates

All created files come with appropriate templates:

- Components include TypeScript interfaces
- Hooks follow React patterns
- Services include dependency injection
- Tests include basic structure

## Enforcement

### Pre-Commit Hooks

- Validates file structure before commit
- Blocks commits with violations
- Suggests auto-fix commands

### CI/CD Pipeline

- Validates structure on every PR
- Runs organization check
- Fails build if structure is invalid

## Best Practices

1. **Always use the CLI** for creating new files
2. **Run the watcher** during development
3. **Check structure** before committing
4. **Use auto-organize** to fix issues

## Troubleshooting

### File Created in Wrong Place

```bash
npm run organize
```

### Naming Convention Error

Use the CLI to create files with correct naming.

### Config File in Root

Move to appropriate workspace directory or use auto-organize.

## Related Documents

- [FILE_PLACEMENT_RULES.md](../FILE_PLACEMENT_RULES.md)
- [REPOSITORY_STANDARDS.md](./REPOSITORY_STANDARDS.md)
