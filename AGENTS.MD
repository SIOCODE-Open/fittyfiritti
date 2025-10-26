# AGENTS.MD - AI Agent Development Guidelines

## Project Overview

**FittyFiritti** is a modern web application that provides real-time audio transcription and intelligent note organization using Chrome's Built-in AI API (Gemini Nano). The application listens to microphone input, transcribes speech in real-time using sliding window processing, and automatically organizes content into structured hierarchical notes with multi-level categorization and asynchronous English to Japanese translation.

## Project Purpose

This project demonstrates and provides tooling for:
- Real-time audio transcription using Chrome's Built-in AI API multi-modal capabilities
- On-device AI model execution for audio-to-text conversion without external API calls
- Intelligent intent recognition for automatic content organization
- Hierarchical note structure with 3 levels of categorization
- Asynchronous bilingual translation (English to Japanese)
- Modern React-based user interface for real-time transcription and note display
- End-to-end testing of multi-modal AI functionality with Playwright

## Project Structure

The project follows a monorepo architecture with the following key directories:

### `/apps/` - Applications
- **`apps/web/`** - Main React application (currently starter content, will be developed further)
  - Built with Vite + React + TypeScript
  - Uses Tailwind CSS for styling
  - Integrates with `@fittyfiritti/built-in-ai-api` package
  - **Status**: Primary development target

- **`apps/test/`** - End-to-end testing suite
  - Uses Playwright for browser automation
  - Tests Chrome Built-in AI API integration
  - Configured with specific Chrome flags for AI functionality
  - **Status**: Functional test suite with known working configuration

### `/packages/` - Shared Libraries
- **`packages/built-in-ai-api/`** - TypeScript API wrapper
  - Provides type definitions for Chrome Built-in AI API
  - Abstracts the global `LanguageModel` API
  - Exports utilities for AI capability detection and usage
  - **Status**: Core library, actively maintained

## Build System & Scripts

The project uses **Turbo** as a build orchestrator with the following key commands available via PNPM:

### Available Scripts
- `pnpm build` - Build all packages and applications
- `pnpm lint` - Run ESLint across all projects
- `pnpm format` - Format code with Prettier across all projects
- `pnpm type-check` - Run TypeScript type checking across all projects
- `pnpm test` - Run end-to-end tests (Playwright)
- `pnpm dev` - Start development servers
- `pnpm clean` - Clean all build artifacts

### Technology Stack
- **Package Manager**: PNPM 9.12.3+
- **Build Tool**: Turbo 2.3.0+
- **Runtime**: Node.js 18+
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4.0 (alpha)
- **Testing**: Playwright
- **Linting**: ESLint 9+ with TypeScript rules
- **Formatting**: Prettier with organize-imports plugin

## 🚨 CRITICAL DEVELOPMENT RULES FOR AI AGENTS

### ❌ FORBIDDEN COMMANDS - NEVER RUN THESE:

1. **NEVER start development servers**:
   - `pnpm dev`
   - `pnpm run dev`
   - `npm run dev`
   - `yarn dev`
   - Any variant that starts a development server

2. **NEVER run end-to-end tests**:
   - `pnpm test`
   - `pnpm test:ui`
   - `pnpm test:headed`
   - `playwright test`
   - Any Playwright test execution commands

### ✅ REQUIRED COMMANDS - ALWAYS RUN THESE:

Before any code changes or commits, AI agents MUST run:

**`pnpm quality-check`** - Runs lint, format, type-check, and build in a single command

### Acceptable Commands:
- `pnpm build` - Building the project
- `pnpm clean` - Cleaning build artifacts
- File reading/writing operations
- Git operations (status, diff, commit, etc.)
- Package installation with `pnpm install`

## Development Workflow for AI Agents

1. **Before making changes**:
   - Read and understand the relevant files
   - Check current project structure
   - Understand the existing TypeScript types and interfaces
   - Plan your TODOs, create atomic tasks to break up the work

2. **During development**:
   - Make focused, incremental changes
   - Maintain TypeScript strict typing
   - Follow existing code patterns and conventions
   - Ensure all imports and dependencies are properly managed

3. **After making changes**:
   - Run `pnpm quality-check` to ensure code quality (runs lint, format, type-check, and build)
   - Fix any errors or warnings reported by the quality check

## Key Technical Considerations

### Chrome Built-in AI Integration
- The project uses the global `LanguageModel` API (NOT `window.ai`)
- Requires specific Chrome flags for testing (see `CHROME_AI_SETUP.md`)
- AI availability should always be checked before usage
- Model download may be required on first use

### TypeScript Configuration
- Strict TypeScript configuration across all packages
- Shared base configuration in root `tsconfig.json`
- Each package/app has its own TypeScript configuration
- Type checking is enforced in the build pipeline

### Code Quality Standards
- ESLint with TypeScript rules and React-specific rules
- Prettier with import organization
- Consistent import patterns using workspace references
- All packages must build without errors or warnings

## File Organization Patterns

- **Source code**: Always in `src/` directories
- **Build output**: `dist/` directories (git-ignored)
- **Configuration**: Root-level config files with package-specific overrides
- **Tests**: End-to-end tests in `apps/test/tests/`
- **Documentation**: Markdown files in project root

## Dependencies Management

- Use workspace references (`workspace:*`) for internal dependencies
- External dependencies declared in individual package.json files
- Shared dev dependencies in root package.json
- PNPM workspace configuration in `pnpm-workspace.yaml`

---

**Remember**: This project is designed for AI development with strict safety guidelines. Always follow the forbidden/required command rules to maintain project stability and avoid interfering with long-running processes or test environments.