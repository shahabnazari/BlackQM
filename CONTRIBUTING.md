# Contributing to VQMethod

Thank you for your interest in contributing to VQMethod! This guide will help you get started with development and ensure your contributions meet our standards.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Testing Guidelines](#testing-guidelines)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Code Review Checklist](#code-review-checklist)
- [Architecture Decision Records](#architecture-decision-records)

---

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

**Our Standards:**
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

**Unacceptable Behavior:**
- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

---

## Getting Started

### Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Git**: Latest version
- **PostgreSQL**: v14+ (for production database testing)
- **SQLite**: Included with Node.js (for development)

### Local Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/vqmethod.git
   cd vqmethod
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original-owner/vqmethod.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Setup environment variables**
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env

   # Edit with your values
   nano .env
   ```

6. **Setup database**
   ```bash
   cd backend
   npm run prisma:migrate
   npm run db:seed  # Optional: seed with demo data
   ```

7. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

8. **Verify setup**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - API Docs: http://localhost:4000/api/docs

---

## Development Workflow

### Branch Naming Conventions

Use descriptive branch names following this pattern:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions or changes
- `chore/description` - Maintenance tasks

**Examples:**
```bash
feature/literature-search-filters
fix/theme-extraction-timeout
refactor/api-service-layer
docs/contributing-guide
test/literature-e2e-tests
chore/update-dependencies
```

### Development Process

1. **Create a new branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

2. **Make your changes**
   - Write code following our [Code Style Guide](#code-style-guide)
   - Add tests for new features
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Run all tests
   npm run test

   # Type checking
   npm run typecheck

   # Linting
   npm run lint

   # E2E tests (if applicable)
   cd frontend && npm run e2e
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add literature search filters"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/my-awesome-feature
   ```

6. **Open a Pull Request** on GitHub

---

## Code Style Guide

### TypeScript

#### General Rules

- **No `any` types** - Use `unknown` with type guards instead
- **Explicit return types** for public functions
- **Prefer `const`** over `let` whenever possible
- **Use destructuring** for object properties
- **Avoid optional chaining abuse** - Use type guards instead

**Good:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User | null {
  const user = users.find(u => u.id === id);
  return user ?? null;
}

// Type guard example
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value
  );
}
```

**Bad:**
```typescript
function getUser(id: any): any {  // ❌ Don't use 'any'
  return users.find(u => u.id === id);
}

const user = users?.find?.(u => u?.id === id)?.name;  // ❌ Too much optional chaining
```

#### React Components

- **Functional components** with TypeScript interfaces
- **Named exports** for components (not default exports)
- **Props interface** before component definition
- **React.memo** for expensive components
- **Custom hooks** for complex logic

**Good:**
```typescript
interface PaperCardProps {
  paper: Paper;
  isSelected: boolean;
  onSelect: (paperId: string) => void;
}

export const PaperCard = React.memo<PaperCardProps>(({ paper, isSelected, onSelect }) => {
  const handleClick = () => onSelect(paper.id);

  return (
    <div onClick={handleClick} className={isSelected ? 'selected' : ''}>
      <h3>{paper.title}</h3>
      <p>{paper.abstract}</p>
    </div>
  );
});

PaperCard.displayName = 'PaperCard';
```

**Bad:**
```typescript
export default function PaperCard(props: any) {  // ❌ Default export, 'any' type
  return (
    <div onClick={() => props.onSelect(props.paper.id)}>
      <h3>{props.paper.title}</h3>
    </div>
  );
}
```

#### Custom Hooks

- **Prefix with `use`** (e.g., `useSearch`, `useThemeExtraction`)
- **Return object** with named properties (not array)
- **Clear return type** definition

**Good:**
```typescript
interface UseSearchReturn {
  results: Paper[];
  isLoading: boolean;
  error: Error | null;
  search: (query: string) => Promise<void>;
}

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = async (query: string) => {
    setIsLoading(true);
    try {
      const data = await literatureAPI.search(query);
      setResults(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, error, search };
}
```

### NestJS Backend

#### Controller Guidelines

- **RESTful routes** with appropriate HTTP methods
- **DTO validation** with class-validator
- **Swagger decorators** for API documentation
- **Rate limiting** for public endpoints
- **Error handling** with custom exceptions

**Good:**
```typescript
@Controller('literature')
@ApiTags('Literature')
export class LiteratureController {
  constructor(private readonly literatureService: LiteratureService) {}

  @Get('search')
  @CustomRateLimit(60, 30)  // 30 requests per minute
  @ApiOperation({ summary: 'Search academic literature' })
  @ApiResponse({ status: 200, description: 'Search results', type: [PaperDto] })
  async search(@Query() query: SearchDto): Promise<PaperDto[]> {
    return await this.literatureService.search(query);
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save paper to library' })
  async savePaper(
    @Body() saveDto: SavePaperDto,
    @Req() req: Request
  ): Promise<{ success: boolean }> {
    const userId = req.user.id;
    return await this.literatureService.savePaper(saveDto, userId);
  }
}
```

#### Service Guidelines

- **Business logic** in services (not controllers)
- **Error handling** with try/catch
- **Logging** with enterprise logger
- **Type safety** throughout

**Good:**
```typescript
@Injectable()
export class LiteratureService {
  private readonly logger = new EnterpriseLogger();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pubmedClient: PubMedClient,
  ) {}

  async search(query: SearchDto): Promise<PaperDto[]> {
    this.logger.startPerformance('literature-search');

    try {
      const results = await this.pubmedClient.search(query.term);
      this.logger.endPerformance('literature-search', 'LiteratureService');
      return results.map(r => this.mapToPaperDto(r));
    } catch (error) {
      this.logger.error('Literature search failed', 'LiteratureService', error);
      throw new InternalServerErrorException('Search failed');
    }
  }
}
```

### Naming Conventions

- **Variables/Functions**: `camelCase` (e.g., `searchResults`, `fetchPapers`)
- **Classes/Interfaces**: `PascalCase` (e.g., `PaperCard`, `UserDto`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RESULTS`, `API_TIMEOUT`)
- **Files**: `kebab-case.ts` (e.g., `literature-search.ts`, `paper-card.tsx`)
- **Components**: `PascalCase.tsx` (e.g., `PaperCard.tsx`, `SearchBar.tsx`)

### Import Organization

Organize imports in this order:

1. External libraries (React, Next.js, etc.)
2. Internal modules (`@/lib`, `@/components`)
3. Relative imports
4. Type imports (if using `import type`)

**Example:**
```typescript
// 1. External libraries
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 2. Internal modules
import { literatureAPI } from '@/lib/api/services/literature-api.service';
import { logger } from '@/lib/utils/logger';
import { PaperCard } from '@/components/literature/PaperCard';

// 3. Relative imports
import { useSearch } from '../hooks/useSearch';
import { formatDate } from '../utils/date';

// 4. Type imports
import type { Paper, SearchFilters } from '@/lib/types/literature.types';
```

---

## Testing Guidelines

### Unit Tests

#### Frontend (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaperCard } from './PaperCard';

describe('PaperCard', () => {
  const mockPaper = {
    id: '123',
    title: 'Test Paper',
    abstract: 'Test abstract',
    authors: ['Author 1'],
  };

  it('renders paper title', () => {
    render(<PaperCard paper={mockPaper} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('Test Paper')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<PaperCard paper={mockPaper} isSelected={false} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Test Paper'));
    expect(onSelect).toHaveBeenCalledWith('123');
  });
});
```

#### Backend (Jest)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { LiteratureService } from './literature.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LiteratureService', () => {
  let service: LiteratureService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiteratureService, PrismaService],
    }).compile();

    service = module.get<LiteratureService>(LiteratureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('search', () => {
    it('should return search results', async () => {
      const query = { term: 'test query' };
      const results = await service.search(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Literature Search', () => {
  test('should search and display results', async ({ page }) => {
    await page.goto('http://localhost:3000/discover/literature');

    // Enter search query
    await page.fill('[data-testid="search-input"]', 'machine learning');
    await page.click('[data-testid="search-button"]');

    // Wait for results
    await page.waitForSelector('[data-testid="paper-card"]');

    // Verify results displayed
    const paperCards = await page.locator('[data-testid="paper-card"]').count();
    expect(paperCards).toBeGreaterThan(0);
  });
});
```

### Test Coverage Requirements

- **Minimum coverage**: 80% for new code
- **Critical paths**: 100% coverage required
- **Run coverage**:
  ```bash
  npm run test -- --coverage
  ```

---

## Git Workflow

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Test additions or changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes (formatting, no logic change)

#### Examples

```bash
feat: add literature search filters

feat(backend): implement rate limiting for public endpoints

fix: resolve theme extraction timeout issue

refactor: extract PaperCard component from main page

docs: update contributing guidelines

test: add E2E tests for literature search flow

chore: update dependencies to latest versions

perf: optimize database queries with indexes
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream main into your branch
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

---

## Pull Request Process

### Before Submitting

1. ✅ **Tests pass**: `npm run test`
2. ✅ **Type check passes**: `npm run typecheck`
3. ✅ **Linting passes**: `npm run lint`
4. ✅ **No console.logs**: Use `logger` instead
5. ✅ **No `any` types**: Use proper TypeScript types
6. ✅ **Documentation updated**: If API or features changed
7. ✅ **Branch up to date**: Rebased on latest `main`

### PR Template

When opening a PR, include:

```markdown
## Description

Brief description of changes and why they're needed.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation update

## Testing

Describe how you tested your changes:
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes (or documented if unavoidable)
- [ ] Tests pass locally
- [ ] TypeScript compilation succeeds

## Screenshots (if applicable)

Add screenshots for UI changes.
```

### PR Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by at least one maintainer
3. **Changes requested** addressed
4. **Approval** from maintainer
5. **Merge** to main branch

---

## Code Review Checklist

### For Reviewers

- [ ] **Code quality**: Follows style guide and best practices
- [ ] **Type safety**: No `any` types, proper TypeScript usage
- [ ] **Testing**: Adequate test coverage (>80%)
- [ ] **Performance**: No obvious performance issues
- [ ] **Security**: No security vulnerabilities introduced
- [ ] **Documentation**: Updated if API/features changed
- [ ] **Error handling**: Proper error handling and logging
- [ ] **Accessibility**: UI changes are accessible (WCAG 2.1 AA)
- [ ] **Mobile responsive**: UI changes work on mobile devices

### For Contributors

- [ ] Self-review completed before requesting review
- [ ] All comments addressed
- [ ] Tests updated and passing
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

---

## Architecture Decision Records

For significant architectural decisions, create an ADR (Architecture Decision Record) in `docs/adr/`:

**Template:**

```markdown
# ADR-XXX: Title

## Status

Accepted | Rejected | Superseded

## Context

What is the issue we're facing?

## Decision

What decision did we make?

## Consequences

What are the positive and negative consequences?

## Alternatives Considered

What alternatives did we consider?
```

**Example ADRs:**
- `ADR-001: Why Zustand for State Management`
- `ADR-002: Why Custom Hooks over Context API`
- `ADR-003: Why Component Extraction Strategy`

---

## Questions or Issues?

- **Discord**: [Join our community](https://discord.gg/vqmethod)
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/vqmethod/issues)
- **Email**: support@vqmethod.com

---

Thank you for contributing to VQMethod! 🎉
