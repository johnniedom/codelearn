# Known Bugs & Limitations

This document lists known issues and limitations in the CodeLearn MVP.

## Critical Issues

### None Currently
All critical issues have been resolved.

---

## Known Limitations

### 1. Hub Sync (Simulated)
- **Status**: Client-side only
- **Description**: The sync service (`src/lib/sync/sync-service.ts`) simulates hub communication. Real sync requires a Raspberry Pi hub server.
- **Impact**: Progress is stored locally but not shared with classmates/teachers.
- **Workaround**: Data persists in IndexedDB for offline use.

### 2. Background Sync
- **Status**: Not fully wired
- **Description**: Service Worker background sync API is configured but not connected to the sync service.
- **Impact**: App won't auto-sync when coming back online; requires manual sync.
- **Workaround**: Use the manual "Sync Now" button.

### 3. Push Notifications
- **Status**: Not implemented
- **Description**: Push notification infrastructure is not set up.
- **Impact**: No server-initiated notifications.
- **Workaround**: Check the in-app notification center manually.

### 4. Video Content
- **Status**: Schema only
- **Description**: `VideoContent` type is defined but no video player component exists.
- **Impact**: Video lessons cannot be played.
- **Workaround**: Use text-based lessons with code examples.

### 5. Advanced Quiz Types
- **Status**: Partially implemented
- **Description**: Only `multiple-choice` and `fill-blank` questions work. These types are defined but not rendered:
  - TrueFalse
  - Matching
  - Ordering
  - CodeOutput
  - CodeCompletion
- **Impact**: Limited question variety.
- **Workaround**: Use MCQ and fill-blank for assessments.

---

## UI/UX Issues

### 1. Large Pyodide Bundle
- **Issue**: First Python execution downloads ~10MB Pyodide runtime.
- **Impact**: Slow first load on slow connections.
- **Mitigation**: Loading progress indicator shown; cached after first load.

### 2. Exercise Page Chunk Size
- **Issue**: `ExercisePage` bundle is 598KB (exceeds 500KB warning).
- **Impact**: Slightly slower initial load for exercise pages.
- **Mitigation**: Code-splitting already applied; consider lazy-loading CodeMirror extensions.

### 3. Read-Only Code Regions
- **Issue**: Read-only regions in exercises are highlighted but not enforced.
- **Impact**: Users can accidentally modify starter code templates.
- **Workaround**: Reset button available to restore original code.

---

## Browser Compatibility

### Tested Browsers
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 90+
- ✅ Safari 15+

### Known Issues
- **Safari Private Browsing**: IndexedDB may be limited; some features may not persist.
- **Older Android WebView**: Pattern Lock touch events may be less responsive.

---

## Performance Notes

### Recommended Specs
- RAM: 4GB+ for Python execution
- Storage: 100MB+ available for IndexedDB
- Network: Initial load requires ~15MB download

### Low-Memory Devices
- Pyodide loader checks for memory pressure
- Warning shown if device has <2GB available RAM
- JavaScript exercises work on all devices

---

## Reporting New Bugs

If you find a bug not listed here:
1. Check if it's a known limitation above
2. Open an issue at: [GitHub Issues URL]
3. Include: browser, device, steps to reproduce

---

*Last updated: 2026-01-15*
