# Image to Palette - AI Coding Instructions

## Architecture Overview

This is a **dual-service application** for extracting and applying color palettes from images:

- **Frontend**: SvelteKit 2 + Svelte 5 (TypeScript, TailwindCSS 4) - Modern UI with canvas manipulation
- **Backend**: Go/Gin API - Image processing, palette extraction using K-means clustering
- **Communication**: REST API between frontend (port 5173) and backend (port 8088)

## Key Technical Patterns

### Svelte 5 Runes (Modern State Management)

This project uses **Svelte 5 runes** extensively - avoid legacy patterns:

```typescript
// ✅ Modern: Use $state runes
let state = $state({ colors: [], isLoading: false });

// ❌ Legacy: Don't use stores unless for cross-component sharing
import { writable } from "svelte/store";
```

**Critical Files**:

- `src/lib/stores/app.svelte.ts` - Main application state store
- `src/lib/stores/auth.svelte.ts` - Authentication state
- `src/lib/stores/tutorial.svelte.ts` - Tutorial state
- `src/lib/stores/popovers.svelte.ts` - UI popover management

### Canvas-Based Image Processing

The core functionality revolves around HTML5 Canvas:

```typescript
// Pattern: Canvas state in app.svelte.ts
canvas: HTMLCanvasElement | null
canvasContext: CanvasRenderingContext2D | null
canvasScaleX/Y: number // Critical for coordinate mapping
```

**Selection System**: Users draw rectangles on canvas to define color extraction regions. Each selector has `{ id, color, selected, selection?: {x,y,w,h} }`.

### API Integration Patterns

```typescript
// All API calls go through src/lib/api/*
await api.extractPalette(file);
await api.applyPaletteBlob(imageBlob, colors, algorithmParams);
```

**Authentication**: JWT-based, with fallback to localStorage for anonymous users. The app syncs local palettes to server on login.

## Component Architecture

### File Organization

```
src/lib/
├── api/           # API client functions
├── components/    # Reusable UI components
│   └── toolbar/   # Palette manipulation tools
│   └── tutorial/  # Tutorial components
├── stores/        # Global state (Svelte 5 runes)
├── types/         # TypeScript definitions
└── utils.ts       # Utility functions
```

### Context Pattern

```typescript
// Toolbar uses Svelte context for state sharing
import { getToolbarContext } from "./context.svelte";
const { state, actions } = getToolbarContext();
```

## Development Workflow

### Development Commands

```bash
# Frontend (from /frontend)
npm run dev          # Development server (port 5173)
npm run build        # Production build
npm run check        # TypeScript + Svelte checks
npm run lint         # ESLint + Prettier checks

# Backend (from /api)
go run .             # Development server (port 8088)
go test ./...        # Run tests
```

**Code Quality Rule**: After making changes to Svelte or TypeScript files, ALWAYS run `npm run format` and `npm run lint` from the `frontend/` directory to ensure code quality and catch potential issues before committing.

** Documents Rule**: Dont create .md files for changes or explanations.

## Critical Integration Points

### Canvas Coordinate System

```typescript
// Always account for canvas scaling when processing selections
const scaledX = selection.x * state.canvasScaleX;
const scaledY = selection.y * state.canvasScaleY;
```

### State Synchronization

The app maintains complex state sync between:

- Canvas interaction state (selections, drag operations)
- Palette extraction state (colors, algorithm parameters)
- Authentication state (user session, saved palettes)
- UI state (modals, loading states)

### Error Handling Pattern

```typescript
// Use svelte-french-toast for consistent UX
import toast from "svelte-french-toast";
const toastId = toast.loading("Processing...");
try {
  // async operation
  toast.success("Success!", { id: toastId });
} catch (error) {
  toast.error(error.message, { id: toastId });
}
```

## Project-Specific Conventions

### Component Naming

- `PascalCase.svelte` for components
- Use `*.svelte.ts` for reactive utilities (not traditional stores)
- Context files: `context.svelte.ts` (not `.ts`)

### State Management

- App-wide state: Use `appStore` from `stores/app.svelte.ts`
- Component state: Use `$state()` runes locally
- Cross-component communication: Svelte context or props

### API Error Handling

All API functions in `lib/api/` use consistent error handling with `ensureOk()` helper that throws meaningful error messages.

### Color Format

Colors are consistently structured as `{ hex: string }` throughout the application.

### Code Comments

**Avoid unnecessary comments** - write self-explanatory code instead:

- ❌ Don't add comments that merely restate what the code does
- ✅ Only add comments for complex logic, non-obvious decisions, or "why" explanations
- Keep the codebase clean and let the code speak for itself

## Available MCP Tools (Svelte Documentation Server)

When working with Svelte/SvelteKit code, you have access to comprehensive documentation tools:

### 1. list-sections

Use this FIRST to discover available documentation sections. Returns structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling list-sections, analyze the returned sections (especially use_cases field) and fetch ALL relevant documentation.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling until no issues remain.

### 4. playground-link

Generates a Svelte Playground link with provided code.
Only call after user confirmation and NEVER if code was written to files in their project.
