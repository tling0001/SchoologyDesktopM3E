# Android Tauri builds

The main GitHub Actions workflow builds an installable Tauri APK. It installs the Android SDK platform/build-tools and a pinned NDK, initializes the generated Tauri Android project, prepares Schoology's camera permission/status bar and launcher icon, then signs and verifies the release APK before uploading it.

## Persistent release signing

Configure these repository secrets to keep the signing key stable between releases:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded Android release keystore.
- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_ALIAS`: key alias in the keystore.
- `ANDROID_KEY_PASSWORD`: key password.

If those secrets are not all present, CI creates a temporary key so the APK remains installable for testing. Such an APK cannot update an installation signed with a different key, and later temporary keys will differ. Configure a persistent keystore before relying on APK updates.

The output is named `Schoology-Android-<version>.apk` and is attached to the versioned GitHub release. To retry just Android, manually run the workflow with **Build only the Android APK** enabled. This workflow builds Tauri, not Electron.
