import type { SettingsSection } from "../pages/SettingsOverlay";

/** Overlays that can reopen on their own after the app reloads to fetch a new deployment. */
export type ResumableOverlay =
  | { overlay: "plugins" }
  | { overlay: "mcp" }
  | { overlay: "messaging" }
  | { overlay: "settings"; section: SettingsSection };

const OVERLAY_RESUME_KEY = "rk:overlay-resume";
const resumableOverlays = new Set<string>(["plugins", "mcp", "messaging", "settings"]);

let openOverlay: ResumableOverlay | null = null;

/** Records the overlay that is open now, so a recovery reload can reopen it. */
export function noteOpenOverlay(overlay: ResumableOverlay | null) {
  openOverlay = overlay;
}

/**
 * Arms a one-shot reopen of the open overlay. Only the preload recovery reload calls this,
 * so a refresh the user asks for stays a plain refresh.
 */
export function armOverlayResume(storage: Pick<Storage, "setItem">) {
  if (!openOverlay) return;
  try {
    storage.setItem(OVERLAY_RESUME_KEY, JSON.stringify(openOverlay));
  } catch {
    // Restricted storage must not block the reload that repairs the tab.
  }
}

/** Returns and clears the overlay armed before the last recovery reload. */
export function takeOverlayResume(
  storage: Pick<Storage, "getItem" | "removeItem"> = sessionStorage,
): ResumableOverlay | null {
  try {
    const raw = storage.getItem(OVERLAY_RESUME_KEY);
    storage.removeItem(OVERLAY_RESUME_KEY);
    const value: unknown = JSON.parse(raw ?? "null");
    if (
      !value ||
      typeof value !== "object" ||
      !("overlay" in value) ||
      typeof value.overlay !== "string" ||
      !resumableOverlays.has(value.overlay)
    )
      return null;
    if (value.overlay !== "settings") return value as ResumableOverlay;
    return {
      overlay: "settings",
      section:
        "section" in value && typeof value.section === "string"
          ? (value.section as SettingsSection)
          : "general",
    };
  } catch {
    return null;
  }
}
