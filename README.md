# Schoology Desktop Port

A Windows-first Electron desktop port of Schoology, implemented from the supplied **Schoology Android 2026.06.0** reference and using the official **matraic M3E** Web Components package.

## Project goals

- Match the supplied Schoology Android app's navigation, screens, behavior, and visual structure as closely as possible.
- Use real M3E Web Components for Material 3 Expressive UI rather than CSS-only recreations or custom wrapper components.
- Preserve Schoology's original icons and artwork where the Android app supplies them.
- Keep the installed product name as **Schoology**.

## Source references

Schoology-specific behavior is based on the supplied `schoology-android-2026-06-0.zip`. Do not substitute unrelated web implementations when changing Schoology behavior.

M3E dependencies are vendored under `vendor/m3e/`. The current build uses the supplied `@m3e/web` **2.9.1** package and the supplied `@m3e/icons` package.

## Repository structure

```text
src/
  main.js             Electron main process and native bridge
  preload.js          Renderer IPC bridge
  renderer.js         Schoology UI, navigation, native screens, API flows
  styles.css          Layout/integration styling
  m3e-bootstrap.js    M3E Web Components bootstrap
  app.html            Authenticated app shell
  index.html          Android-style splash entry
  appboot.js          Renderer startup/error bridge
  splash.js           Splash-to-app transition
assets/               Schoology/Android artwork and application assets
vendor/m3e/           Vendored M3E packages used for reproducible builds
package.json          Version, dependencies, and electron-builder configuration
```

## M3E implementation

M3E components are loaded from the vendored package rather than recreated locally. Examples include:

- `m3e-theme`
- `m3e-app-bar`
- `m3e-drawer-container`
- `m3e-nav-menu` / `m3e-nav-menu-item`
- `m3e-tabs`
- `m3e-list` / `m3e-action-list` / `m3e-list-action`
- `m3e-card`
- `m3e-dialog`
- `m3e-expansion-panel` / `m3e-accordion`
- `m3e-split-pane`
- `m3e-fab` / `m3e-fab-menu`
- M3E progress indicators and dividers

Interactive M3E action lists use `m3e-list-action` children so M3E can provide its native hover, focus, pressed, and state-layer behavior.

## Development

```bash
npm install
npm start
```

For a Windows production build:

```bash
npm run dist:win
```

The Windows build produces an NSIS installer and an unpacked directory build.

## Versioning

The authoritative application version is the `version` field in `package.json`. Release automation should derive its GitHub release/tag version from that value rather than maintaining a second version number.

The installed product remains named **Schoology**, even though the project/repository is named **Schoology Desktop Port**.

## Updates

The Settings page currently exposes the existing **Check for Updates** workflow. Variant installers such as Schoology Classic and Schoology Liquid Glass are separate actions and are not part of the normal update check.

## Reproducible builds

The M3E packages needed by the application are stored in `vendor/m3e/` so the build does not depend on downloading the M3E packages at release time. Electron-builder packages the vendored/runtime dependencies into the application.

Do not rename a supplied M3E tarball to claim a different version; the package's internal `package.json` version must match the dependency version used by the project.

## Testing

Before packaging:

1. Run JavaScript syntax checks for `src/main.js`, `src/preload.js`, and `src/renderer.js`.
2. Verify the supplied M3E tarballs contain the expected package versions.
3. Build the Windows NSIS target.
4. Launch the installed application and check the splash/startup path, authentication, drawer navigation, tabs, course landscape/portrait layouts, shared WebViews, assignments, grades, messages, calendar, settings scrolling, and update check.
5. Test the installer on a clean Windows profile when possible.

## Commit messages

Changes to this project should use a concise imperative commit message describing the primary user-visible change.
