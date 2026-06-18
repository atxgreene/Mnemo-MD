// Tauri application entry point. The frontend is the same Vite/React build
// served on the web — Tauri just wraps `dist/` in a native window.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Mnemo Med");
}
