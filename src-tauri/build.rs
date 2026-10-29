fn main() {
    let manifest = std::fs::read_to_string("../package.json").unwrap_or_default();
    let version = serde_json::from_str::<serde_json::Value>(&manifest)
        .ok()
        .and_then(|value| value.get("version").and_then(|v| v.as_str()).map(str::to_owned))
        .unwrap_or_else(|| "2026.10.0-port.3".to_owned());
    println!("cargo:rustc-env=SCHOOLGY_APP_VERSION={version}");
    tauri_build::build()
}
