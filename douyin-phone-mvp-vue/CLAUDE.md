# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`douyin-vue` is a mobile short-video SPA that mimics the Douyin (TikTok) experience. It is built with Vue 3, Vite, and Pinia. All data is local — API requests are intercepted by `axios-mock-adapter` and served from local JSON files.

## Tech Stack

- **Framework**: Vue 3.5 + TypeScript
- **Build Tool**: Vite 6
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: Less
- **Mock**: axios-mock-adapter (no real backend)
- **Lazy Load**: @jambonn/vue-lazyload

## Common Commands

```bash
# Install dependencies
npm install

# Development server (port 3000)
npm run dev

# Production build
npm run build

# Type check
npm run type-check

# Lint and auto-fix
npm run lint

# Format with Prettier
npm run format

# Preview production build (port 5555)
npm run preview

# Build for specific deployment targets
npm run build-gp-pages      # GitHub Pages
npm run build-gitee-pages   # Gitee Pages
npm run build-uni-app       # Uni-app mode
```

## Architecture

### Router & Navigation Animation

The app uses **conditional route caching** with `keep-alive`. The router dynamically manages `excludeNames` in Pinia store to control which components are cached:

- **Forward navigation** (deeper route): removes the target component from `excludeNames` so it renders fresh
- **Back navigation**: adds the leaving component to `excludeNames` so it gets destroyed and re-created on next visit

Route depth is determined by index in `routes.ts`, not URL path depth.

**Tab bar pages** (`/home`, `/me`, `/shop`, `/message`, `/publish`) skip transition animations when navigating between each other.

**History mode**: Uses `createWebHistory` by default. Switches to `createWebHashHistory` when deployed to sub-domains (`IS_SUB_DOMAIN` is true for Gitee Pages / GitHub Pages).

### Mock Data System

All API calls are intercepted by `axios-mock-adapter` in `src/mock/index.ts`. Data sources:

- `src/assets/data/posts6.json` — Main recommendation video feed
- `public/data/videos.md` — Additional video metadata loaded at runtime
- `public/data/comments/video_id_*.md` — Per-video comments
- `public/data/users.md` — User profiles
- `public/data/goods.md` — Shop/goods data
- `src/assets/data/resource.js` — Static resource bundle (music, users)

The mock system loads `posts6.json` eagerly and fetches additional video lists from `public/data/videos.md` after a 1-second delay.

### Build Configuration (vite.config.ts)

- **CDN imports** for production: Vue, Vue Router, Vue Demi, and MockJS are loaded from `lib.baomitu.com` CDN
- **Vue Macros** plugin enables experimental Vue features
- **Manual chunks**: Components referenced by multiple importers go to `common`, node_modules to `vendor`, and less-frequently-used pages to `other`
- **Git commit hash** is injected as `LATEST_COMMIT_HASH` at build time
- `base: './'` for relative path deployment

### Chovy Integration

The share-sheet's first video action is `入口` (Entry), which routes to `/shop/debate` and opens the Chovy app. The Chovy app is expected at `D:\Desktop\Chovy` (sibling directory).

```bash
# Check Chovy is reachable
npm run chovy:check

# Start Chovy alongside the dev server
npm run chovy:start
```

Override the Chovy entry URL with `VITE_CHOVY_ENTRY_URL` env var (defaults to `http://localhost:5000`).

### Multi-Agent Development Workflow

This project uses a lightweight multi-agent system for coordinated development. See `docs/MULTI_AGENT_DEVELOPMENT.md` for the full protocol.

**Dispatcher commands:**
```bash
npm run agent:dispatch -- status     # Show task state
npm run agent:dispatch -- plan       # Generate task plan
npm run agent:dispatch -- ready      # List ready tasks
npm run agent:dispatch -- dispatch   # Assign ready tasks
```

**Video pipeline agents:**
```bash
npm run agent:discover-videos -- --source <manifest> --min-total 6 --beauty-ratio 0.33
npm run agent:import-videos -- --manifest <manifest>
npm run agent:insert-local-videos
```

The task state is tracked in `docs/agent-workflow/tasks.json`.

### Key Source Directories

- `src/pages/home/` — Main video feed, live streaming, search, publish
- `src/pages/home/slide/` — Slide sub-views (Community, LongVideo, Slide0/2/4)
- `src/components/slide/` — Core slide/scroll components (`SlideVertical`, `SlideHorizontal`, `SlideVerticalInfinite`, `BaseVideo`)
- `src/pages/shop/` — Shop, goods detail, and Chovy debate entry (`BuyDebate.vue`)
- `src/pages/me/` — User profile, settings, collections
- `src/pages/message/` — Messages, chat, notifications
- `src/pages/login/` — Login flows
- `src/utils/` — Utilities, hooks (`useClick`, `useNav`, `useScroll`), event bus

### Global Event Bus

`src/utils/bus.ts` provides a lightweight event bus. Key events in `EVENT_KEY` include `HIDE_MUTED_NOTICE`, `REMOVE_MUTED`, and various slide/video lifecycle events.

### Click Proxy

In `main.ts`, `HTMLElement.prototype.addEventListener` is proxied to suppress click events when `window.isMoved` is true. This prevents accidental clicks during touch scroll gestures. The `v-click` directive (`useClick`) provides additional click handling.

### Mobile-First Constraints

- The app is designed for mobile viewport only. Use browser dev tools mobile mode (`Ctrl+Shift+M`) to preview.
- CSS `rem` units are used with a root font-size scaled to viewport width (target 375px base).
- `user-select: none` is applied globally.
- On desktop (min-width: 500px), the app is constrained to 500px width and centered.

## Environment Variables

The project reads from `env/` directory. Key build-time vars:

- `VITE_ENV` — `DEV`, `PROD`, `GP_PAGES`, `GITEE_PAGES`, or `UNI`
- `VITE_CHOVY_ENTRY_URL` — URL for Chovy app entry (default: `http://localhost:5000`)

## Deployment Notes

- **GitHub Pages**: Use `npm run build-gp-pages`
- **Gitee Pages**: Use `npm run build-gitee-pages` (sets `base: '/douyin'`)
- **Vercel**: One-click deploy via the repository URL
- **Docker**: Image `ghcr.io/zyronon/douyin-vue:latest`
