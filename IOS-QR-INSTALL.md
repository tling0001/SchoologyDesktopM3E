# iPhone QR installation (Tauri)

The release workflow can build a signed Ad Hoc IPA and publish an install QR code. This job is optional: if the iOS signing secrets are not configured, desktop and Android builds continue and the iOS job reports that it skipped the signed package.

## Apple setup

1. Enroll in the Apple Developer Program.
2. Create an App ID with bundle identifier `com.schoologytauri.app`.
3. Register the target iPhone/iPad UDID.
4. Create an **Ad Hoc** provisioning profile for `com.schoologytauri.app`, using the Apple Distribution certificate and including the registered device.
5. The provisioning profile must be available to App Store Connect so `Apple-Actions/download-provisioning-profiles@v7.0.0` can retrieve it.

## GitHub Actions secrets and variables

Configure these repository secrets under **Settings → Secrets and variables → Actions**:

- `APPSTORE_API_PRIVATE_KEY`: contents of the App Store Connect API private key `.p8`.
- `IOS_CERTIFICATE_P12_BASE64`: base64-encoded Apple Distribution certificate `.p12`.
- `IOS_CERTIFICATE_PASSWORD`: password that unlocks that `.p12`.

Configure these repository variables or secrets:

- `APPSTORE_API_KEY_ID`: App Store Connect API key ID.
- `APPSTORE_ISSUER_ID`: App Store Connect issuer ID.
- `APPLE_TEAM_ID`: 10-character Apple Developer Team ID.

The certificate-generation workflow also uses the App Store Connect API key to create an iOS Distribution certificate. Run **Actions → Tauri cross-platform builds and releases → Run workflow** and check **Generate the iOS distribution certificate and setup artifact only**. Download the short-lived `Schoology-iOS-Certificate-Setup` artifact securely, then set the two `IOS_CERTIFICATE_*` secrets from the generated text files. Do not commit or share the `.p12`, password, private key, or provisioning profile.

`IOS_CERTIFICATE_PASSWORD` is the password for the exported iOS distribution `.p12`. It is not the App Store Connect API private key and is not the macOS certificate password.

## Build and install

On a normal push to `main`, the workflow builds Tauri desktop packages and Android APK, and attempts the optional Ad Hoc iOS build when signing is configured. The release contains versioned assets such as:

- `Schoology-<version>-iOS-AdHoc.ipa`
- `Schoology-<version>-iOS-AdHoc.plist` (Apple OTA install manifest)
- `Schoology-<version>-iOS-Install-QR.png`

The release must be publicly accessible for over-the-air installation. Scan the QR code using the iPhone camera. The target device must be registered in the selected Ad Hoc profile. Apple also requires Developer Mode for running apps installed from an IPA: enable it in **Settings → Privacy & Security → Developer Mode**, restart, and confirm.

To rebuild only the iOS Ad Hoc package, manually run the workflow with **Build only the iOS Ad Hoc package and publish its assets** enabled. This publishes the iOS assets without rebuilding the desktop/Android packages.
