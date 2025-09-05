#!/usr/bin/env node

/**
 * VQMethod File Creation Tool
 * Ensures all files are created following repository standards
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

// File type definitions with rules
const FILE_TYPES = {
  // Frontend Components
  'react-component': {
    workspace: 'frontend',
    baseDir: 'components',
    extension: '.tsx',
    naming: 'PascalCase',
    template: 'react-component',
    description: 'React component with TypeScript',
  },
  'apple-ui-component': {
    workspace: 'frontend',
    baseDir: 'components/apple-ui',
    extension: '.tsx',
    naming: 'PascalCase',
    template: 'apple-ui-component',
    description: 'Apple Design System component',
  },
  page: {
    workspace: 'frontend',
    baseDir: 'app',
    extension: '.tsx',
    naming: 'lowercase',
    template: 'next-page',
    description: 'Next.js page component',
  },
  layout: {
    workspace: 'frontend',
    baseDir: 'app',
    extension: '.tsx',
    naming: 'lowercase',
    fileName: 'layout',
    template: 'next-layout',
    description: 'Next.js layout component',
  },
  'api-route': {
    workspace: 'frontend',
    baseDir: 'app/api',
    extension: '.ts',
    naming: 'lowercase',
    fileName: 'route',
    template: 'api-route',
    description: 'Next.js API route handler',
  },
  hook: {
    workspace: 'frontend',
    baseDir: 'lib/hooks',
    extension: '.ts',
    naming: 'camelCase',
    prefix: 'use',
    template: 'react-hook',
    description: 'Custom React hook',
  },
  util: {
    workspace: 'frontend',
    baseDir: 'lib/utils',
    extension: '.ts',
    naming: 'camelCase',
    template: 'utility',
    description: 'Utility function',
  },
  style: {
    workspace: 'frontend',
    baseDir: 'styles',
    extension: '.css',
    naming: 'kebab-case',
    template: 'stylesheet',
    description: 'CSS stylesheet',
  },

  // Backend Files
  module: {
    workspace: 'backend',
    baseDir: 'src/modules',
    extension: '.module.ts',
    naming: 'kebab-case',
    template: 'nest-module',
    description: 'NestJS module',
    createFolder: true,
  },
  controller: {
    workspace: 'backend',
    baseDir: 'src/modules',
    extension: '.controller.ts',
    naming: 'kebab-case',
    template: 'nest-controller',
    description: 'NestJS controller',
  },
  service: {
    workspace: 'backend',
    baseDir: 'src/modules',
    extension: '.service.ts',
    naming: 'kebab-case',
    template: 'nest-service',
    description: 'NestJS service',
  },
  dto: {
    workspace: 'backend',
    baseDir: 'src/modules',
    extension: '.dto.ts',
    naming: 'kebab-case',
    template: 'nest-dto',
    description: 'NestJS DTO',
  },
  entity: {
    workspace: 'backend',
    baseDir: 'src/modules',
    extension: '.entity.ts',
    naming: 'kebab-case',
    template: 'nest-entity',
    description: 'NestJS/Prisma entity',
  },
  guard: {
    workspace: 'backend',
    baseDir: 'src/modules',
    extension: '.guard.ts',
    naming: 'kebab-case',
    template: 'nest-guard',
    description: 'NestJS guard',
  },

  // Test Files
  test: {
    workspace: 'auto',
    baseDir: 'auto',
    extension: '.spec.ts',
    naming: 'same',
    template: 'test',
    description: 'Test file',
  },
  'e2e-test': {
    workspace: 'frontend',
    baseDir: 'e2e',
    extension: '.spec.ts',
    naming: 'kebab-case',
    template: 'e2e-test',
    description: 'E2E test with Playwright',
  },

  // Documentation
  doc: {
    workspace: 'root',
    baseDir: 'Lead',
    extension: '.md',
    naming: 'UPPER_SNAKE_CASE',
    template: 'documentation',
    description: 'Documentation file',
  },

  // Scripts
  script: {
    workspace: 'root',
    baseDir: 'scripts',
    extension: '.js',
    naming: 'kebab-case',
    template: 'node-script',
    description: 'Node.js script',
  },
  'shell-script': {
    workspace: 'root',
    baseDir: 'scripts',
    extension: '.sh',
    naming: 'kebab-case',
    template: 'shell-script',
    description: 'Shell script',
  },
};

// File templates
const TEMPLATES = {
  'react-component': name => `import React from 'react';

interface ${name}Props {
  // Add props here
}

/**
 * ${name} Component
 */
export const ${name}: React.FC<${name}Props> = ({}) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

export default ${name};
`,

  'apple-ui-component': name => `'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const ${name.toLowerCase()}Variants = cva(
  'inline-flex items-center justify-center rounded-xl transition-all duration-200 font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
        ghost: 'hover:bg-gray-100 active:bg-gray-200'
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ${name}Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ${name.toLowerCase()}Variants> {
  children?: React.ReactNode;
}

/**
 * ${name} - Apple Design System Component
 * 
 * @example
 * <${name} variant="primary" size="md">
 *   Content
 * </${name}>
 */
export const ${name} = React.forwardRef<HTMLDivElement, ${name}Props>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(${name.toLowerCase()}Variants({ variant, size, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

${name}.displayName = '${name}';

export default ${name};
`,

  'next-page': name => `import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${name} | VQMethod',
  description: '${name} page',
};

export default function ${name}Page() {
  return (
    <main>
      <h1>${name}</h1>
      {/* Page content */}
    </main>
  );
}
`,

  'next-layout': name => `export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Layout wrapper */}
      {children}
    </>
  );
}
`,

  'api-route': name => `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Handle GET request
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Handle POST request
    return NextResponse.json({ message: 'Created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
`,

  'react-hook': name => `import { useState, useEffect } from 'react';

/**
 * ${name} Hook
 */
export const ${name} = () => {
  const [state, setState] = useState();

  useEffect(() => {
    // Effect logic
  }, []);

  return {
    state,
    // Return values
  };
};

export default ${name};
`,

  utility: name => `/**
 * ${name} utility function
 */
export const ${name} = () => {
  // Implementation
};

export default ${name};
`,

  stylesheet: name => `/* ${name} styles */

.container {
  /* Styles */
}
`,

  'nest-module': name => `import { Module } from '@nestjs/common';
import { ${toPascalCase(name)}Controller } from './${name}.controller';
import { ${toPascalCase(name)}Service } from './${name}.service';

@Module({
  controllers: [${toPascalCase(name)}Controller],
  providers: [${toPascalCase(name)}Service],
  exports: [${toPascalCase(name)}Service],
})
export class ${toPascalCase(name)}Module {}
`,

  'nest-controller':
    name => `import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ${toPascalCase(name)}Service } from './${name}.service';

@ApiTags('${name}')
@Controller('${name}')
export class ${toPascalCase(name)}Controller {
  constructor(private readonly ${toCamelCase(name)}Service: ${toPascalCase(name)}Service) {}

  @Get()
  @ApiOperation({ summary: 'Get all ${name}' })
  async findAll() {
    return this.${toCamelCase(name)}Service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${name} by ID' })
  async findOne(@Param('id') id: string) {
    return this.${toCamelCase(name)}Service.findOne(id);
  }
}
`,

  'nest-service': name => `import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

@Injectable()
export class ${toPascalCase(name)}Service {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // Implementation
    return [];
  }

  async findOne(id: string) {
    // Implementation
    return { id };
  }
}
`,

  'nest-dto':
    name => `import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create${toPascalCase(name)}Dto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class Update${toPascalCase(name)}Dto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
`,

  'nest-entity': name => `// Prisma model for ${name}
// Add to schema.prisma:

/*
model ${toPascalCase(name)} {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Add fields here
}
*/

export interface ${toPascalCase(name)} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add fields here
}
`,

  'nest-guard':
    name => `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ${toPascalCase(name)}Guard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // Guard logic
    return true;
  }
}
`,

  test: name => `import { describe, it, expect, beforeEach } from 'vitest';

describe('${name}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should work correctly', () => {
    // Test
    expect(true).toBe(true);
  });
});
`,

  'e2e-test': name => `import { test, expect } from '@playwright/test';

test.describe('${name}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should work correctly', async ({ page }) => {
    // Test implementation
    await expect(page).toHaveTitle(/VQMethod/);
  });
});
`,

  documentation: name => `# ${name.replace(/_/g, ' ')}

## Overview

[Provide overview here]

## Purpose

[Describe the purpose]

## Details

[Add detailed information]

## Status

- **Created:** ${new Date().toISOString().split('T')[0]}
- **Last Updated:** ${new Date().toISOString().split('T')[0]}
- **Status:** Draft

## Related Documents

- [REPOSITORY_STANDARDS.md](./REPOSITORY_STANDARDS.md)
- [FILE_PLACEMENT_RULES.md](../FILE_PLACEMENT_RULES.md)
`,

  'node-script': name => `#!/usr/bin/env node

/**
 * ${name} Script
 */

const fs = require('fs');
const path = require('path');

// Script configuration
const config = {
  // Add configuration
};

// Main function
async function main() {
  console.log('Running ${name}...');
  
  try {
    // Script logic
    
    console.log('✅ ${name} completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
`,

  'shell-script': name => `#!/bin/bash

# ${name} Script
# Purpose: [Add purpose]

set -e  # Exit on error

echo "🚀 Running ${name}..."

# Script logic here

echo "✅ ${name} completed successfully"
`,
};

// Naming convention converters
function toPascalCase(str) {
  return str.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase());
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str) {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

function toSnakeCase(str) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

function toUpperSnakeCase(str) {
  return toSnakeCase(str).toUpperCase();
}

// Apply naming convention
function applyNaming(name, convention, prefix = '') {
  let result = name;

  switch (convention) {
    case 'PascalCase':
      result = toPascalCase(name);
      break;
    case 'camelCase':
      result = toCamelCase(name);
      break;
    case 'kebab-case':
      result = toKebabCase(name);
      break;
    case 'UPPER_SNAKE_CASE':
      result = toUpperSnakeCase(name);
      break;
    case 'lowercase':
      result = name.toLowerCase();
      break;
    case 'same':
      // Keep as is
      break;
  }

  if (prefix && !result.startsWith(prefix)) {
    result = prefix + result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

// Create file with template
function createFile(type, name, subpath = '') {
  const config = FILE_TYPES[type];
  if (!config) {
    console.error(`${colors.red}❌ Unknown file type: ${type}${colors.reset}`);
    process.exit(1);
  }

  // Apply naming convention
  const fileName =
    config.fileName || applyNaming(name, config.naming, config.prefix);

  // Determine full path
  let workspace = config.workspace === 'root' ? '' : config.workspace + '/';
  let basePath = config.baseDir;

  // Handle auto workspace detection for tests
  if (config.workspace === 'auto') {
    // Try to determine from context
    workspace = 'frontend/'; // Default to frontend
    basePath = subpath || 'tests';
  }

  // Build full path
  const dir = path.join(process.cwd(), workspace, basePath, subpath);
  const filePath = path.join(dir, fileName + config.extension);

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.error(
      `${colors.red}❌ File already exists: ${filePath}${colors.reset}`
    );
    process.exit(1);
  }

  // Create directory if needed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`${colors.green}✅ Created directory: ${dir}${colors.reset}`);
  }

  // Get template content
  const template = TEMPLATES[config.template];
  const content = template ? template(fileName) : '';

  // Write file
  fs.writeFileSync(filePath, content);
  console.log(`${colors.green}✅ Created file: ${filePath}${colors.reset}`);

  // Create additional files if needed
  if (config.createFolder && type === 'module') {
    const moduleDir = path.join(dir, fileName);
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    // Create module files
    createFile('controller', name, fileName);
    createFile('service', name, fileName);
    createFile('dto', name, fileName + '/dto');
  }

  return filePath;
}

// Interactive mode
async function interactive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = query => new Promise(resolve => rl.question(query, resolve));

  console.log(`${colors.cyan}🎯 VQMethod File Creator${colors.reset}\n`);

  // Show file types
  console.log('Available file types:');
  Object.entries(FILE_TYPES).forEach(([key, config]) => {
    console.log(
      `  ${colors.yellow}${key.padEnd(20)}${colors.reset} - ${config.description}`
    );
  });

  console.log('');
  const type = await question('Enter file type: ');

  if (!FILE_TYPES[type]) {
    console.error(`${colors.red}❌ Invalid file type${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  const name = await question('Enter name: ');
  const subpath = await question('Enter subpath (optional): ');

  rl.close();

  createFile(type, name, subpath);
}

// CLI usage
function showHelp() {
  console.log(`
${colors.cyan}VQMethod File Creator${colors.reset}

Usage: 
  create-file <type> <name> [subpath]
  create-file --interactive
  create-file --help

File Types:
${Object.entries(FILE_TYPES)
  .map(
    ([key, config]) =>
      `  ${colors.yellow}${key.padEnd(20)}${colors.reset} ${config.description}`
  )
  .join('\n')}

Examples:
  create-file react-component Button
  create-file apple-ui-component Card
  create-file module auth
  create-file hook useUserData
  create-file test Button components/apple-ui

Options:
  --interactive, -i    Interactive mode
  --help, -h          Show this help
  `);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (
    args.length === 0 ||
    args.includes('--interactive') ||
    args.includes('-i')
  ) {
    interactive();
  } else if (args.includes('--help') || args.includes('-h')) {
    showHelp();
  } else {
    const [type, name, subpath] = args;
    if (!type || !name) {
      console.error(
        `${colors.red}❌ Usage: create-file <type> <name> [subpath]${colors.reset}`
      );
      process.exit(1);
    }
    createFile(type, name, subpath);
  }
}

module.exports = { createFile, FILE_TYPES };
