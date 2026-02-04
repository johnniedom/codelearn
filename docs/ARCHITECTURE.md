# CodeLearn PWA - Architecture Document

**Generated:** 2026-01-16
**Version:** 1.0 (MVP)

---

## Executive Summary

CodeLearn is an **offline-first Progressive Web App (PWA)** for coding education, designed for underserved communities with limited/intermittent internet access. The application enables 30+ days of offline learning with local data persistence and eventual sync to a Raspberry Pi classroom hub.

---

## System Architecture Overview

![System Architecture Overview](../public/SystemArchOverview.png)

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

![State Management](../public/Statemanagement.png)

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

![Data Layer](../public/DataLayer.png)

### Data Integrity Features

- **Hash Chain:** Progress records linked via SHA-256 `previousHash`
- **HMAC Signatures:** Each record signed with HMAC-SHA256
- **Sequence Numbers:** Monotonically increasing for ordering
- **Conflict Detection:** Hybrid Logical Clock (HLC) timestamps

---

## 6. PWA & Offline Architecture

![PWA Architecture](../public/PWA_Architecture.png)

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

![Code Execution](../public/CodeExecution.png)

### Execution Constraints

| Constraint | Value |
|------------|-------|
| Execution timeout | 30 seconds |
| Pyodide load size | ~10MB (cached) |
| Memory recommendation | 4GB+ RAM |
| Error handling | Beginner-friendly messages |

---

## 9. Sync Architecture

![Sync Architecture](../public/SyncArchitecture.png)

### Sync Constraints

| Parameter | Value |
|-----------|-------|
| Max retry attempts | 5 |
| Queue retention | 30 days |
| Items per user | 1000 max |
| Hub check timeout | 5 seconds |

---

## 10. Security Architecture

![Security Architecture](../public/SecurityArch.png)

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

## 13. On-Premise Deployment Model

![On-Premise Deployment Model](../public/DeploymentModel.png)

### Overview

CodeLearn is designed for **on-premise deployment in classrooms** where internet connectivity is limited or unavailable. The deployment model uses a local server (Raspberry Pi or school PC) as a classroom hub, creating a self-contained learning environment.

### Deployment Layers

#### Layer 1: Cloud / Internet (Optional)
- **Content Repository** — centralized course packages and updates
- **CodeLearn Hub Cloud** — optional centralized content sync
- **USB / SD Card** — alternative offline content loading when no internet is available
- **Internet is NOT required** — content can be loaded entirely via USB or SD card

#### Layer 2: Local Hub (Classroom Server)
- **Hardware:** Raspberry Pi 4/5 (2GB+ RAM, ~$35) or any school PC with Node.js 18+
- **Hub Server** — serves the CodeLearn PWA to devices over local WiFi
- **Sync API** — accepts sync deltas from student devices via `POST /api/sync`
- **Content Store** — master copy of all course content
- **Analytics DB** — stores aggregated student progress for teacher dashboards
- **WiFi Access Point** — basic router creates a local classroom network (no internet required)

#### Layer 3: Student Devices (In Classroom)
- **Any device with a modern browser** — phones, tablets, laptops
- **PWA auto-installs** on first visit to the Hub URL
- **All content cached locally** via Service Worker + IndexedDB
- **Multi-user support** — shared devices use profile switching with PIN + Pattern Lock MFA
- **Code execution** — Python (Pyodide WASM) and JavaScript run entirely in-browser

#### Layer 4: Offline at Home (No Internet)
- **Students continue learning** at home with all lessons, quizzes, and code editor working offline
- **Progress saved locally** in IndexedDB (persists 30+ days)
- **Auto-sync on reconnect** — when students return to class and join Hub WiFi, progress deltas sync automatically

### Sync Flow (Delta-Based)

1. **Connect** — Student device joins classroom WiFi
2. **Install** — PWA auto-installs from Hub (first visit only)
3. **Learn** — All content works offline after first sync
4. **Sync** — Progress deltas sent to Hub with HLC timestamps
5. **Resolve** — Conflicts handled via Last-Write-Wins (CRDT)
6. **Offline** — Students continue learning at home, no internet needed

### Deployment Specifications

| Category | Details |
|----------|---------|
| **Hub Hardware** | Raspberry Pi 4/5 (2GB+ RAM) or any PC with Node.js 18+, ~16GB storage, WiFi router |
| **Student Devices** | Any device with a browser (Android/iOS/Chrome/Firefox), ~100MB storage per user, 4GB+ RAM for Python |
| **Security** | AES-256-GCM encryption, Argon2id hashing, PIN + Pattern Lock MFA, multi-user isolation |
| **Sync Protocol** | Hybrid Logical Clock (HLC), delta-based (only changes sent), CRDT conflict resolution (LWW), SHA-256 integrity |

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
- ✓ Complete multi-factor authentication (PIN + Pattern Lock)
- ✓ Robust local data persistence with integrity verification
- ✓ Full PWA support with 30+ days offline capability
- ✓ In-browser code execution (Python via Pyodide, JavaScript)
- ✓ Comprehensive content type system with 15 Python lessons
- ✓ Role-based CMS for content authoring
- ✓ Sync infrastructure ready for hub integration

*Document generated from codebase analysis. See individual spec files in `specs/` directory for detailed requirements.*
