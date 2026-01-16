# CodeLearn PWA - Architecture Document

**Generated:** 2026-01-16
**Version:** 1.0 (MVP)

---

## Executive Summary

CodeLearn is an **offline-first Progressive Web App (PWA)** for coding education, designed for underserved communities with limited/intermittent internet access. The application enables 30+ days of offline learning with local data persistence and eventual sync to a Raspberry Pi classroom hub.

---

## System Architecture Overview

```
+---------------------------------------------------------------------+
|                         CodeLearn PWA                                |
|                    (Offline-First Architecture)                      |
+---------------------------------------------------------------------+
|                                                                      |
|  +-----------+  +-----------+  +-----------+  +----------+          |
|  |  React 19 |  |  Zustand  |  |   Dexie   |  | Service  |          |
|  |  + Router |  |   Stores  |  | IndexedDB |  |  Worker  |          |
|  +-----+-----+  +-----+-----+  +-----+-----+  +-----+----+          |
|        |              |              |              |                |
|        +==============+==============+==============+                |
|                       |              |                               |
|  +--------------------+--------------+-----------------------------+ |
|  |                    Application Layer                            | |
|  |  +--------+  +--------+  +--------+  +------------+            | |
|  |  |  Auth  |  |Content |  |  Code  |  |    Sync    |            | |
|  |  |Service |  | Loader |  |Executor|  |   Service  |            | |
|  |  +--------+  +--------+  +--------+  +------------+            | |
|  +-----------------------------------------------------------------+ |
|                                                                      |
|  +-----------------------------------------------------------------+ |
|  |                    Execution Layer                              | |
|  |  +------------------+    +------------------------------+       | |
|  |  |  Pyodide WASM    |    |  JS Sandbox (eval + timeout) |       | |
|  |  | (Python runtime) |    |                              |       | |
|  |  +------------------+    +------------------------------+       | |
|  +-----------------------------------------------------------------+ |
|                                                                      |
+---------------------------------------------------------------------+
                                   |
                                   | Sync (when online)
                                   v
                    +-----------------------------+
                    |     Raspberry Pi Hub        |
                    |  (Phase 6 - Not in MVP)     |
                    |  - SQLite + REST API        |
                    |  - mDNS discovery           |
                    +-----------------------------+
```

---

## 1. Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | 19.x | UI components, hooks |
| **Build Tool** | Vite | 7.x | Fast bundling, HMR |
| **Language** | TypeScript | 5.x | Type safety |
| **Routing** | React Router DOM | 7.x | SPA navigation |
| **State** | Zustand | 5.x | Global state management |
| **Database** | Dexie.js | 4.x | IndexedDB wrapper |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **UI Primitives** | Radix UI | Various | Accessible components |
| **Code Editor** | CodeMirror 6 | Various | In-browser code editing |
| **Python Runtime** | Pyodide | 0.29.x | Python in WASM |
| **PWA** | vite-plugin-pwa | 1.x | Service worker generation |
| **Crypto** | hash-wasm | 4.x | Argon2id password hashing |

---

## 2. Directory Structure

```
src/
├── components/           # ~85 TSX files in 13 subdirectories
│   ├── auth/            # PIN, Pattern Lock, Registration
│   ├── cms/             # Content Management System
│   ├── common/          # ErrorBoundary, Skeletons
│   ├── content/         # Lessons, Courses, Progress, Bloom badges
│   ├── dashboard/       # Stats, Progress Overview
│   ├── navigation/      # TopBar, BottomNav
│   ├── notifications/   # Notification center
│   ├── onboarding/      # Offline guide
│   ├── quiz/            # MCQ, Fill-blank questions
│   ├── sync/            # Sync status indicators
│   ├── ui/              # Radix primitives (13 files)
│   └── workbench/       # Code editor, Output panel
├── data/                # Sample course data (15 Python lessons)
├── hooks/               # Custom React hooks
├── lib/                 # Core services (~30 files)
│   ├── auth/            # Crypto, session, permissions
│   ├── cms/             # Asset service, drafts
│   ├── content/         # Package loader, progress tracker
│   ├── db/              # Dexie schema, 15 tables
│   ├── execution/       # Python/JS runners
│   ├── notifications/   # Notification service
│   └── sync/            # HLC, sync queue, sync service
├── pages/               # Route pages (~15 files)
│   └── cms/             # CMS pages (8 files)
├── stores/              # 4 Zustand stores
└── types/               # TypeScript definitions
```

---

## 3. Component Architecture

```
<ErrorBoundary>
  <AuthInitializer>
    <BrowserRouter>
      <AppLayout>
        +-------------------------------------+
        |             <TopBar />              |
        +-------------------------------------+
        |                                     |
        |  <Suspense fallback={Loading}>      |
        |    <Routes>                         |
        |      - Public: /profiles, /login    |
        |      - Protected: /dashboard, etc   |
        |      - CMS: /cms/* (role-gated)     |
        |    </Routes>                        |
        |  </Suspense>                        |
        |                                     |
        +-------------------------------------+
        |           <BottomNav />             |
        +-------------------------------------+
        <OfflineGuide />  {onboarding modal}
      </AppLayout>
    </BrowserRouter>
  </AuthInitializer>
</ErrorBoundary>
```

### Key Component Groups

| Group | Components | Purpose |
|-------|------------|---------|
| **Auth** | PatternLock, PINInput, RegistrationForm, RoleSelector | Multi-factor authentication |
| **Content** | LessonViewer, MarkdownRenderer, ProgressCard, BloomLevelBadge, AuthorCard | Learning content display |
| **Workbench** | CodeEditor, OutputPanel, TestResults, PyodideLoadingProgress | Code execution environment |
| **Quiz** | QuizPlayer, MCQQuestion, FillBlankQuestion | Assessment engine |
| **CMS** | LessonEditor, QuizEditor, ExerciseEditor, ContentBrowser | Content authoring |

---

## 4. State Management (Zustand)

```
+------------------------------------------------------------------+
|                        Zustand Stores                             |
+-----------------+-----------------+------------------------------+
|   authStore     |    uiStore      |        syncStore             |
|   (persisted)   |    (partial)    |        (partial)             |
+-----------------+-----------------+------------------------------+
| - currentUser   | - theme         | - isOnline                   |
| - session       | - modals        | - hubUrl                     |
| - isLocked      | - toasts        | - syncStatus                 |
| - credentials   | - loading       | - pendingItemsCount          |
| - role          | - sidebar       | - lastSyncAt                 |
+-----------------+-----------------+------------------------------+
        |                              |
        v                              v
   localStorage                   localStorage
   (encrypted)                    (hubUrl only)
```

### Session Security Rules

| Trigger | Action |
|---------|--------|
| 30 min idle | Lock (require PIN) |
| 8 hour max session | End session |
| Tab hidden > 5 min | Lock |
| 45-day credential age | Warning -> Read-only -> Locked |

---

## 5. Data Layer (IndexedDB via Dexie)

**Database:** `CodeLearnDB` (Version 4)

```
+-----------------------------------------------------------------+
|                        IndexedDB Tables                          |
+------------------+------------------+---------------------------+
|    Identity      |      Learning    |          System           |
+------------------+------------------+---------------------------+
| - profiles       | - progress       | - syncQueue               |
| - credentials    | - quizAttempts   | - notifications           |
| - sessions       | - contentIndex   | - deviceState             |
| - mfaData        |                  | - auditLogs               |
+------------------+------------------+---------------------------+
|                          CMS Tables                              |
+-----------------------------------------------------------------+
| - authorProfiles  - authorActivity  - contentDrafts  - localAssets |
+-----------------------------------------------------------------+
```

### Data Integrity Features

- **Hash Chain:** Progress records linked via SHA-256 `previousHash`
- **HMAC Signatures:** Each record signed with HMAC-SHA256
- **Sequence Numbers:** Monotonically increasing for ordering
- **Conflict Detection:** Hybrid Logical Clock (HLC) timestamps

---

## 6. PWA & Offline Architecture

```
+-----------------------------------------------------------------+
|                     Service Worker Strategy                      |
+-----------------------------------------------------------------+
|                                                                  |
|  PRECACHE (build time):                                         |
|  - All JS/CSS bundles                                           |
|  - HTML shell                                                   |
|  - Fonts, icons                                                 |
|  - Pyodide WASM (~10MB, after first load)                       |
|                                                                  |
|  RUNTIME CACHE:                                                 |
|  - Google Fonts -> CacheFirst (1 year)                          |
|  - API responses -> NetworkFirst (when hub available)           |
|                                                                  |
+-----------------------------------------------------------------+
|                    Offline Capabilities                          |
+-----------------------------------------------------------------+
|  [x] All user data persisted in IndexedDB                       |
|  [x] All static assets cached                                   |
|  [x] Python execution via Pyodide (cached WASM)                 |
|  [x] JavaScript execution (built-in)                            |
|  [x] Content packages stored locally                            |
|  [x] Target: 30+ days offline operation                         |
+-----------------------------------------------------------------+
```

---

## 7. Routing Architecture

```
Routes
|-- Public (no auth required)
|   |-- /profiles         -> Profile selection
|   |-- /register         -> New user registration
|   +-- /login            -> PIN/Pattern entry
|
|-- Protected (authenticated users)
|   |-- /                 -> Redirect to dashboard
|   |-- /dashboard        -> Learning overview
|   |-- /courses          -> Course catalog
|   |-- /courses/:slug    -> Course details + modules
|   |-- /lessons/:c/:m/:l -> Lesson viewer
|   |-- /quizzes/:c/:m/:q -> Quiz player
|   |-- /exercises/:c/:m/:e -> Code workbench
|   |-- /notifications    -> Notification center
|   +-- /settings         -> User preferences
|
+-- CMS (author/teacher role required)
    |-- /cms              -> CMS dashboard
    |-- /cms/content      -> Content browser
    |-- /cms/lessons/:id? -> Lesson editor
    |-- /cms/quizzes/:id? -> Quiz editor
    |-- /cms/exercises/:id? -> Exercise editor
    |-- /cms/assets       -> Asset manager
    |-- /cms/drafts       -> Draft management
    +-- /cms/settings     -> CMS settings
```

---

## 8. Code Execution Architecture

```
+-----------------------------------------------------------------+
|                    Code Execution Pipeline                       |
+-----------------------------------------------------------------+
|                                                                  |
|  User Code                                                       |
|      |                                                          |
|      v                                                          |
|  +---------------+                                              |
|  | CodeMirror 6  |  <- Syntax highlighting, autocomplete        |
|  |   (Editor)    |                                              |
|  +-------+-------+                                              |
|          |                                                      |
|          v                                                      |
|  +---------------------------------------------+                |
|  |           Language Router                    |                |
|  +----------------+----------------------------+                |
|  |    Python      |       JavaScript           |                |
|  |       |        |            |               |                |
|  |       v        |            v               |                |
|  |  +---------+   |    +--------------+       |                |
|  |  | Pyodide |   |    | eval() with  |       |                |
|  |  |  WASM   |   |    | timeout wrap |       |                |
|  |  +---------+   |    +--------------+       |                |
|  +--------+-------+------------+---------------+                |
|           |                    |                                 |
|           +----------+---------+                                |
|                      v                                           |
|             +---------------+                                   |
|             |  Test Runner  |  <- Compare output vs expected    |
|             |  (visible +   |                                   |
|             |  hidden tests)|                                   |
|             +-------+-------+                                   |
|                     v                                            |
|             +---------------+                                   |
|             | OutputPanel   |  <- Results display               |
|             +---------------+                                   |
|                                                                  |
+-----------------------------------------------------------------+
```

### Execution Constraints

| Constraint | Value |
|------------|-------|
| Execution timeout | 30 seconds |
| Pyodide load size | ~10MB (cached) |
| Memory recommendation | 4GB+ RAM |
| Error handling | Beginner-friendly messages |

---

## 9. Sync Architecture

```
+-----------------------------------------------------------------+
|                     Sync Flow Diagram                            |
+-----------------------------------------------------------------+
|                                                                  |
|   PWA (Client)                         Hub (Server)              |
|   +--------------+                    +--------------+          |
|   |              |  1. Check Online   |              |          |
|   |  syncStore   | -----------------> |  /api/health |          |
|   |              |                    |              |          |
|   |              |  2. Get Changes    |              |          |
|   |  syncQueue   | <----------------- |  SQLite DB   |          |
|   |              |    (since HLC)     |              |          |
|   |              |                    |              |          |
|   |              |  3. Push Changes   |              |          |
|   |  IndexedDB   | -----------------> |              |          |
|   |              |    (delta sync)    |              |          |
|   +--------------+                    +--------------+          |
|                                                                  |
+-----------------------------------------------------------------+
|                    Conflict Resolution                           |
+-----------------------------------------------------------------+
|  Strategy: Last-Write-Wins (LWW) using Hybrid Logical Clock     |
|                                                                  |
|  HLC = { wallTime: number, counter: number, nodeId: string }    |
|                                                                  |
|  Compare: If wallTime equal -> use counter -> use nodeId        |
|                                                                  |
|  Result: Deterministic winner regardless of arrival order       |
+-----------------------------------------------------------------+
```

### Sync Constraints

| Parameter | Value |
|-----------|-------|
| Max retry attempts | 5 |
| Queue retention | 30 days |
| Items per user | 1000 max |
| Hub check timeout | 5 seconds |

---

## 10. Security Architecture

```
+-----------------------------------------------------------------+
|                    Authentication Flow                           |
+-----------------------------------------------------------------+
|                                                                  |
|  Registration                                                    |
|  +-------------+    +-------------+    +-------------+          |
|  |   Profile   | -> |   6-digit   | -> |   Pattern   |          |
|  |   (name,    |    |     PIN     |    |    Lock     |          |
|  |   avatar)   |    |             |    |   (MFA)     |          |
|  +-------------+    +------+------+    +------+------+          |
|                            |                  |                  |
|                            v                  v                  |
|                    +------------------------------+              |
|                    |   Argon2id Hash + Salt      |              |
|                    |   (stored in credentials)    |              |
|                    +------------------------------+              |
|                                                                  |
+-----------------------------------------------------------------+
|                    Login Flow                                    |
+-----------------------------------------------------------------+
|                                                                  |
|  +-------------+    +-------------+    +-------------+          |
|  |   Select    | -> |   Enter     | -> |   Draw      |          |
|  |   Profile   |    |    PIN      |    |   Pattern   |          |
|  +-------------+    +-------------+    +-------------+          |
|                                                |                  |
|                                                v                  |
|                                        +-------------+           |
|                                        |   Session   |           |
|                                        |   Created   |           |
|                                        +-------------+           |
|                                                                  |
+-----------------------------------------------------------------+
```

### Security Features

| Feature | Implementation |
|---------|----------------|
| PIN hashing | Argon2id (OWASP recommended) |
| Session timeout | 30 min idle, 8 hr max |
| MFA | Pattern Lock (9-dot grid) |
| Audit logging | All auth events tracked |
| Data integrity | Hash chain + HMAC signatures |

---

## 11. Content Data Model

```
+-----------------------------------------------------------------+
|                    Content Hierarchy                             |
+-----------------------------------------------------------------+
|                                                                  |
|  Course                                                          |
|  +-- Module (1..n)                                               |
|      |-- Lesson (1..n)                                           |
|      |   |-- title, description                                  |
|      |   |-- contentMarkdown                                     |
|      |   |-- learningObjectives[] (with Bloom levels)            |
|      |   |-- duration, difficulty                                |
|      |   +-- author, prerequisites                               |
|      |                                                           |
|      |-- Quiz (1..n)                                             |
|      |   |-- title, description                                  |
|      |   |-- questions[] (MCQ, fill-blank)                       |
|      |   |-- passingScore, timeLimit                             |
|      |   +-- difficulty, points                                  |
|      |                                                           |
|      +-- Exercise (1..n)                                         |
|          |-- title, description                                  |
|          |-- starterCode, solution                               |
|          |-- testCases[] (visible + hidden)                      |
|          |-- language (python, javascript)                       |
|          +-- hints[], difficulty                                 |
|                                                                  |
+-----------------------------------------------------------------+
```

### Bloom's Taxonomy Levels

| Level | Description | Action Verbs |
|-------|-------------|--------------|
| **Remember** | Recall facts | Define, List, Identify |
| **Understand** | Explain ideas | Explain, Describe, Summarize |
| **Apply** | Use information | Implement, Execute, Use |
| **Analyze** | Break down information | Compare, Examine, Differentiate |
| **Evaluate** | Justify decisions | Assess, Judge, Critique |
| **Create** | Produce new work | Design, Build, Construct |

---

## 12. Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Initial bundle | ~600KB | Lazy-loaded chunks |
| Pyodide first load | ~10MB | Cached after first use |
| Exercise chunk | ~598KB | Code-split |
| Recommended RAM | 4GB+ | For Python execution |
| Offline storage | ~50MB+ | Content + user data |
| Target FCP | <2s | First Contentful Paint |

---

## 13. Current Limitations (Known Bugs)

| Feature | Status | Impact |
|---------|--------|--------|
| Hub Sync | Simulated | Progress local only |
| Background Sync | Not wired | Manual sync only |
| Push Notifications | Not implemented | No server push |
| Video Content | Schema only | No video player |
| Quiz Types | 2 of 10 | MCQ + Fill-blank only |
| mDNS Discovery | Planned Phase 6 | Manual hub URL |

See `KNOWN_BUGS.md` for full details.

---

## 14. Deployment Architecture (MVP)

```
+-----------------------------------------------------------------+
|                    MVP Deployment                                |
+-----------------------------------------------------------------+
|                                                                  |
|   Build: pnpm build                                              |
|   Output: dist/ (static files)                                   |
|                                                                  |
|   Deployment Options:                                            |
|   - Vercel (recommended for demo)                               |
|   - Netlify                                                      |
|   - GitHub Pages                                                 |
|   - Any static file host                                         |
|                                                                  |
|   Future (Phase 6-7):                                            |
|   - Raspberry Pi Hub with SQLite                                |
|   - mDNS for local discovery                                    |
|   - REST API for sync                                           |
|                                                                  |
+-----------------------------------------------------------------+
```

### Build Commands

```bash
# Development
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

---

## Conclusion

CodeLearn is a **production-ready offline-first PWA** with:

- [x] Complete multi-factor authentication (PIN + Pattern Lock)
- [x] Robust local data persistence with integrity verification
- [x] Full PWA support with 30+ days offline capability
- [x] In-browser code execution (Python via Pyodide, JavaScript)
- [x] Comprehensive content type system with 15 Python lessons
- [x] Role-based CMS for content authoring
- [x] Sync infrastructure ready for hub integration

The architecture follows modern React patterns with proper separation of concerns and is ready for MVP submission.

---

## Future Roadmap

### Phase 6: Hub Server
- Raspberry Pi deployment with SQLite
- REST API endpoints
- mDNS discovery (`codelearn.local`)

### Phase 7: Enhanced Features
- Background sync
- Push notifications
- Video content player
- Additional quiz types

---

*Document generated from codebase analysis. See individual spec files in `specs/` directory for detailed requirements.*
