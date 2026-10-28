# Schoology Desktop M3E — port 2026.10.0-port.1

## [2026.10.0-port.1]

### Tauri migration foundation
- Add a Tauri v2 native-host and renderer bridge while preserving the existing Electron/M3E runtime.
- Prepare the staged Tauri frontend before Actions builds and bundle the Windows updater helper inside the main Tauri package.
- Preserve native desktop WebView session-cookie installation before the first protected request.
- Start the 2026.10.0 port version series.

### Shared Schoology updates
- Use shared post cards for course updates, group updates, school profile updates, and person profile updates.
- Add comment and like counts with embedded icons, hydrated commenter avatars, threaded replies, comment previews, and a full comments dialog.
- Restore poll option rendering and voting in shared posts.
- Gate course/group update creation on the API permission response and add group discussion creation only when permitted.

### Members and submissions
- Add searchable course and group member directories with All, Members, and Admins filters.
- Add annotated-submission actions only when Schoology reports the required annotation action and a supported PDF is available.
- Add native iOS/Android safe-area handling and preserve reduced-motion behavior for the added UI.

### Desktop shell and updates
- Make automatic startup and manual update checks use the SchoologyDesktopM3E GitHub releases, not the Classic repository.
- Add the Tauri window-controls overlay and a segmented M3E navigation list for landscape course views while keeping Upcoming visible.
- Align QR login and client identity headers with the official Schoology Android 2026.10.0 API behavior.
- Exclude the Schoology LTI service host from Chrome-to-desktop link routing and complete the dark-mode school Info surface styling.
